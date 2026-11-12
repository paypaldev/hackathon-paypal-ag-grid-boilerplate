import { callGemini, isGeminiEnabled } from '@/lib/gemini';
import { computeSha256, parseToMinorUnits } from './crypto';
import type {
  CurrencyCode,
  ScopeContent,
  ScopeDeliverable,
  ScopeFieldEvidence,
  ScopeMilestone,
  SourceDocument,
  SourceSpan,
} from './types';

export interface ScopeDraftResult {
  content: ScopeContent;
  evidence: ScopeFieldEvidence[];
  sourceDocument: SourceDocument;
  extractedWithModel: string;
}

/**
 * Finds exact string offset within the source text for verifiable citation.
 */
export function locateQuoteSpan(
  rawText: string,
  quote: string,
  sourceDocumentId: string
): SourceSpan | undefined {
  if (!quote || quote.length < 3) return undefined;
  const cleanQuote = quote.trim();
  const index = rawText.indexOf(cleanQuote);
  if (index !== -1) {
    return {
      id: `span-${computeSha256(cleanQuote).slice(0, 10)}`,
      sourceDocumentId,
      startOffset: index,
      endOffset: index + cleanQuote.length,
      quotedText: cleanQuote,
    };
  }
  // Case-insensitive fallback lookup
  const lowerRaw = rawText.toLowerCase();
  const lowerQuote = cleanQuote.toLowerCase();
  const lowerIndex = lowerRaw.indexOf(lowerQuote);
  if (lowerIndex !== -1) {
    return {
      id: `span-${computeSha256(cleanQuote).slice(0, 10)}`,
      sourceDocumentId,
      startOffset: lowerIndex,
      endOffset: lowerIndex + cleanQuote.length,
      quotedText: rawText.substring(lowerIndex, lowerIndex + cleanQuote.length),
    };
  }
  return undefined;
}

/**
 * Deterministic rule-based fallback extractor for reliable, repeatable extraction
 * when LLM quota is exhausted or running in offline test mode.
 */
export function extractScopeDeterministically(rawText: string, sourceDocId: string): ScopeDraftResult {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  // Detect currency and total amount
  let detectedCurrency: CurrencyCode = 'USD';
  let totalAmountMinor: number | null = null;
  let priceQuote = '';

  const moneyMatch = rawText.match(/(\$|€|£|₹|USD|EUR|GBP|INR)\s?([0-9,]+(?:\.[0-9]{2})?)/i) ||
                     rawText.match(/([0-9,]+(?:\.[0-9]{2})?)\s?(USD|EUR|GBP|INR|\$|€|£|₹)/i);

  if (moneyMatch) {
    priceQuote = moneyMatch[0];
    const curSymbol = (moneyMatch[1] || moneyMatch[2] || '$').toUpperCase();
    if (curSymbol.includes('€') || curSymbol.includes('EUR')) detectedCurrency = 'EUR';
    else if (curSymbol.includes('£') || curSymbol.includes('GBP')) detectedCurrency = 'GBP';
    else if (curSymbol.includes('₹') || curSymbol.includes('INR')) detectedCurrency = 'INR';
    else detectedCurrency = 'USD';

    const numStr = (moneyMatch[2] || moneyMatch[1] || '').replace(/,/g, '');
    totalAmountMinor = parseToMinorUnits(numStr);
  }

  // Detect project goal / title
  let projectGoal = "Custom software and design development milestone";
  const goalLine = lines.find((l) =>
    l.toLowerCase().includes('need') ||
    l.toLowerCase().includes('build') ||
    l.toLowerCase().includes('design') ||
    l.toLowerCase().includes('project')
  );
  if (goalLine) {
    projectGoal = goalLine.replace(/^(hi|hello|hey|we need|please build)\s*,?/i, '').trim();
  }

  // Parse deliverables
  const deliverables: ScopeDeliverable[] = [];
  const evidence: ScopeFieldEvidence[] = [];

  // Look for deliverables keywords or bullet points
  const bulletLines = lines.filter((l) => /^[-*•\d.]\s+/.test(l));
  if (bulletLines.length > 0) {
    bulletLines.forEach((line, idx) => {
      const clean = line.replace(/^[-*•\d.]\s+/, '').trim();
      const dId = `deliv-${idx + 1}`;
      deliverables.push({
        id: dId,
        title: clean.slice(0, 60),
        description: clean,
        acceptanceCriteria: [
          `Must satisfy all requirements stated in: "${clean.slice(0, 80)}"`,
          'Responsive, tested and free of visual artifacts',
        ],
      });

      const span = locateQuoteSpan(rawText, clean, sourceDocId);
      evidence.push({
        id: `ev-${dId}`,
        fieldPath: `deliverables[${idx}].title`,
        sourceSpan: span,
        confidence: span ? 0.95 : 0.7,
        needsConfirmation: false,
      });
    });
  } else {
    // Default fallback deliverable
    const dId = 'deliv-1';
    deliverables.push({
      id: dId,
      title: projectGoal.slice(0, 60),
      description: projectGoal,
      acceptanceCriteria: [
        'Satisfies client requirements outlined in initial brief',
        'Delivered in production-ready format',
      ],
    });
    const span = locateQuoteSpan(rawText, projectGoal, sourceDocId);
    evidence.push({
      id: `ev-${dId}`,
      fieldPath: 'deliverables[0].title',
      sourceSpan: span,
      confidence: span ? 0.9 : 0.6,
      needsConfirmation: !span,
    });
  }

  // Milestones
  const milestones: ScopeMilestone[] = [];
  if (totalAmountMinor && totalAmountMinor > 0) {
    // Single or 2-split milestone
    if (deliverables.length >= 2) {
      const split1 = Math.round(totalAmountMinor * 0.5);
      const split2 = totalAmountMinor - split1;
      milestones.push({
        id: 'm-1',
        title: `Milestone 1: Initial Delivery & Core Assets`,
        amountMinor: split1,
        currency: detectedCurrency,
        dueAt: null, // Needs confirmation
        deliverableIds: [deliverables[0].id],
        status: 'PENDING',
      });
      milestones.push({
        id: 'm-2',
        title: `Milestone 2: Final Polish & Production Release`,
        amountMinor: split2,
        currency: detectedCurrency,
        dueAt: null, // Needs confirmation
        deliverableIds: deliverables.slice(1).map((d) => d.id),
        status: 'PENDING',
      });
    } else {
      milestones.push({
        id: 'm-1',
        title: 'Project Milestone 1: Final Deliverable & Acceptance',
        amountMinor: totalAmountMinor,
        currency: detectedCurrency,
        dueAt: null,
        deliverableIds: deliverables.map((d) => d.id),
        status: 'PENDING',
      });
    }
  } else {
    // Missing price -> needs confirmation!
    milestones.push({
      id: 'm-1',
      title: 'Milestone 1: Primary Delivery',
      amountMinor: null, // NULL: Never invent price!
      currency: detectedCurrency,
      dueAt: null,
      deliverableIds: deliverables.map((d) => d.id),
      status: 'PENDING',
    });
  }

  // Missing questions
  const missingQuestions: string[] = [];
  if (!totalAmountMinor) {
    missingQuestions.push('No total budget or rate was mentioned in the chat. What is the agreed price?');
  }
  missingQuestions.push('What is the target completion date or deadline for each milestone?');
  missingQuestions.push('What are the specific staging/preview environments or file formats required for handover?');

  // Evidence for price
  const priceSpan = priceQuote ? locateQuoteSpan(rawText, priceQuote, sourceDocId) : undefined;
  evidence.push({
    id: 'ev-total-amount',
    fieldPath: 'totalAmountMinor',
    sourceSpan: priceSpan,
    confidence: priceSpan ? 0.98 : 0.0,
    needsConfirmation: !totalAmountMinor,
    notes: totalAmountMinor ? undefined : 'Budget not detected in conversation text',
  });

  return {
    content: {
      projectGoal,
      clientName: null,
      freelancerName: null,
      deliverables,
      milestones,
      assumptions: [
        'Client provides feedback within 48 hours of each milestone submission',
        'Work limited strictly to agreed deliverables; revisions exceeding 2 rounds require a change order',
      ],
      exclusions: [
        'Third-party software licensing, hosting, and domain costs are excluded',
        '24/7 on-call production maintenance is out of scope',
      ],
      missingQuestions,
      currency: detectedCurrency,
      totalAmountMinor,
    },
    evidence,
    sourceDocument: {
      id: sourceDocId,
      projectId: 'proj-temp',
      sourceType: 'CLIENT_CHAT',
      rawText,
      submittedBy: 'freelancer',
      createdAt: new Date().toISOString(),
    },
    extractedWithModel: 'deterministic-regex-fallback',
  };
}

/**
 * Extracts structured scope from conversation text using Gemini with strict schema grounding,
 * and falls back to deterministic extraction on any error or missing key.
 */
export async function extractScopeFromSource(
  rawText: string,
  sourceDocId: string = `src-doc-${Date.now().toString(36)}`
): Promise<ScopeDraftResult> {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error('Source text cannot be empty');
  }

  if (!isGeminiEnabled()) {
    return extractScopeDeterministically(rawText, sourceDocId);
  }

  const prompt = `You are Proofline's Scope Extraction Engine for independent professionals.
Your task is to analyze the provided client conversation text and extract structured project terms.

STRICT INVARIANTS:
1. ONLY extract terms that are directly mentioned in the text.
2. If price, currency, or deadline is NOT explicitly stated in the source, return null for that field and add a question to missingQuestions. NEVER invent or hallucinate financial values or dates!
3. For every extracted deliverable and price, provide the EXACT verbatim quote from the text.
4. Deliverables must have concrete, measurable acceptance criteria.

Return pure JSON matching this exact structure:
{
  "projectGoal": "Concise summary of what the client wants",
  "clientName": "Extracted name or null",
  "freelancerName": "Extracted name or null",
  "currency": "USD" | "EUR" | "GBP" | "INR",
  "totalAmount": 2500.00 | null,
  "priceQuote": "exact quote where price was stated or null",
  "deliverables": [
    {
      "id": "deliv-1",
      "title": "Short title",
      "description": "Clear details",
      "quote": "verbatim quote from source",
      "acceptanceCriteria": ["Measurable criterion 1", "Measurable criterion 2"]
    }
  ],
  "milestones": [
    {
      "id": "m-1",
      "title": "Milestone title",
      "amount": 1250.00 | null,
      "deliverableIds": ["deliv-1"],
      "dueDate": "YYYY-MM-DD" | null
    }
  ],
  "assumptions": ["standard assumption 1"],
  "exclusions": ["out of scope item 1"],
  "missingQuestions": ["Clarification question 1"]
}

SOURCE TEXT TO EXTRACT:
"""
${rawText}
"""`;

  try {
    const geminiRes = await callGemini(prompt, {
      jsonMode: true,
      temperature: 0.1,
      timeoutMs: 12000,
    });

    const parsed = JSON.parse(geminiRes.text);

    // Validate and convert into typed ScopeDraftResult
    const deliverables: ScopeDeliverable[] = (parsed.deliverables || []).map((d: Record<string, unknown>, idx: number) => ({
      id: (d.id as string) || `deliv-${idx + 1}`,
      title: String(d.title || `Deliverable ${idx + 1}`),
      description: String(d.description || ''),
      acceptanceCriteria: Array.isArray(d.acceptanceCriteria) ? (d.acceptanceCriteria as string[]) : ['Meets specification'],
    }));

    const totalAmountMinor = parsed.totalAmount !== null && parsed.totalAmount !== undefined
      ? parseToMinorUnits(parsed.totalAmount)
      : null;

    const milestones: ScopeMilestone[] = (parsed.milestones || []).map((m: Record<string, unknown>, idx: number) => ({
      id: (m.id as string) || `m-${idx + 1}`,
      title: String(m.title || `Milestone ${idx + 1}`),
      amountMinor: m.amount !== null && m.amount !== undefined ? parseToMinorUnits(m.amount as number) : null,
      currency: (parsed.currency as CurrencyCode) || 'USD',
      dueAt: (m.dueDate as string) || null,
      deliverableIds: Array.isArray(m.deliverableIds) ? (m.deliverableIds as string[]) : deliverables.map((d) => d.id),
      status: 'PENDING',
    }));

    const evidence: ScopeFieldEvidence[] = [];

    // Locate citations
    (parsed.deliverables || []).forEach((d: Record<string, unknown>, idx: number) => {
      const span = locateQuoteSpan(rawText, (d.quote as string) || (d.title as string) || '', sourceDocId);
      evidence.push({
        id: `ev-deliv-${idx}`,
        fieldPath: `deliverables[${idx}].title`,
        sourceSpan: span,
        confidence: span ? 0.95 : 0.7,
        needsConfirmation: !span,
      });
    });

    if (parsed.priceQuote) {
      const priceSpan = locateQuoteSpan(rawText, parsed.priceQuote, sourceDocId);
      evidence.push({
        id: 'ev-price',
        fieldPath: 'totalAmountMinor',
        sourceSpan: priceSpan,
        confidence: priceSpan ? 0.98 : 0.8,
        needsConfirmation: !totalAmountMinor,
      });
    }

    return {
      content: {
        projectGoal: parsed.projectGoal || 'Custom development project',
        clientName: parsed.clientName || null,
        freelancerName: parsed.freelancerName || null,
        deliverables: deliverables.length > 0 ? deliverables : [
          {
            id: 'deliv-1',
            title: parsed.projectGoal || 'Custom deliverables',
            description: parsed.projectGoal || 'Full project delivery',
            acceptanceCriteria: ['Passes client review'],
          },
        ],
        milestones: milestones.length > 0 ? milestones : [
          {
            id: 'm-1',
            title: 'Milestone 1',
            amountMinor: totalAmountMinor,
            currency: (parsed.currency as CurrencyCode) || 'USD',
            dueAt: null,
            deliverableIds: ['deliv-1'],
            status: 'PENDING',
          },
        ],
        assumptions: parsed.assumptions || [],
        exclusions: parsed.exclusions || [],
        missingQuestions: parsed.missingQuestions || [],
        currency: (parsed.currency as CurrencyCode) || 'USD',
        totalAmountMinor,
      },
      evidence,
      sourceDocument: {
        id: sourceDocId,
        projectId: 'proj-temp',
        sourceType: 'CLIENT_CHAT',
        rawText,
        submittedBy: 'freelancer',
        createdAt: new Date().toISOString(),
      },
      extractedWithModel: geminiRes.model,
    };
  } catch (err) {
    console.warn('[Proofline Scope Agent] Gemini call failed, utilizing deterministic extractor:', err);
    return extractScopeDeterministically(rawText, sourceDocId);
  }
}

