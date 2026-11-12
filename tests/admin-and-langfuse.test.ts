import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUsersState,
} from '../src/lib/users-data';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  resetProductsState,
} from '../src/lib/products-data';
import {
  getSystemHealth,
  markServiceAvailable,
  resyncAllServices,
} from '../src/lib/system-health';
import {
  recordTrace,
  getTraces,
  getTraceById,
  updateTraceFeedback,
} from '../src/lib/langfuse-tracer';

describe('VeriSettle AI — React Admin Dashboard & Langfuse Multi-Modal Suite', () => {
  beforeEach(() => {
    resetUsersState();
    resetProductsState();
  });

  // TEST 1: User Management State & Profile Inspection
  it('1. users_crud_lifecycle: creates, inspects, updates and deletes users with spend & risk scores', () => {
    const initial = getUsers();
    expect(initial.length).toBeGreaterThanOrEqual(5);

    // Get user by ID
    const user = getUserById('USR-8012');
    expect(user).toBeDefined();
    expect(user?.name).toBe('Elena Rostova');
    expect(user?.spendHistory.length).toBe(6);
    expect(user?.transactions.length).toBeGreaterThanOrEqual(1);

    // Create user
    const created = createUser({
      name: 'Sofia Valente',
      email: 'sofia@valente-logistics.it',
      role: 'SUPPLIER',
      company: 'Valente Freight SRL',
      totalSpendUsd: 15400.0,
      riskScore: 0.15,
    });
    expect(created.id).toMatch(/^USR-\d+$/);
    expect(getUserById(created.id)?.name).toBe('Sofia Valente');

    // Update user
    const updated = updateUser(created.id, { status: 'SUSPENDED', totalSpendUsd: 18000.0 });
    expect(updated?.status).toBe('SUSPENDED');
    expect(updated?.totalSpendUsd).toBe(18000.0);

    // Delete user
    const deleted = deleteUser(created.id);
    expect(deleted).toBe(true);
    expect(getUserById(created.id)).toBeUndefined();
  });

  // TEST 2: Product Catalog & Anomaly Z-Score Evaluation
  it('2. products_catalog_crud: manages SKUs, computes anomaly Z-scores, and tracks inventory thresholds', () => {
    const prods = getProducts();
    expect(prods.length).toBeGreaterThanOrEqual(6);

    const rack = getProductById('PROD-RACK-42U');
    expect(rack).toBeDefined();
    expect(rack?.category).toBe('Cloud Hardware');
    expect(rack?.priceHistory.length).toBe(6);

    // Create a new SKU
    const newSku = createProduct({
      name: '100GbE QSFP28 Transceiver Module',
      sku: 'SKU-OPTIC-100G',
      category: 'Cabling & Optics',
      priceUsd: 380.0,
      marketAverageUsd: 350.0,
      stockUnits: 120,
      minThresholdUnits: 20,
    });

    expect(newSku.sku).toBe('SKU-OPTIC-100G');
    expect(newSku.status).toBe('IN_STOCK');
    expect(newSku.zScore).toBeDefined();

    // Trigger low stock
    const updated = updateProduct(newSku.id, { stockUnits: 5 });
    expect(updated?.status).toBe('LOW_STOCK');

    // Trigger out of stock
    const outOfStock = updateProduct(newSku.id, { stockUnits: 0 });
    expect(outOfStock?.status).toBe('OUT_OF_STOCK');

    // Cleanup
    deleteProduct(newSku.id);
    expect(getProductById(newSku.id)).toBeUndefined();
  });

  // TEST 3: System Availability & Circuit Breakers
  it('3. system_availability_telemetry: verifies health status, latency monitors, and resync action', () => {
    const health = getSystemHealth();
    expect(health.length).toBe(5);

    const paypalSvc = health.find((s) => s.id === 'svc-paypal');
    expect(paypalSvc).toBeDefined();
    expect(paypalSvc?.status).toBe('OPERATIONAL');
    expect(paypalSvc?.latencyMs).toBeGreaterThan(0);

    // Mark service available
    const marked = markServiceAvailable('svc-python-ml');
    expect(marked?.status).toBe('OPERATIONAL');

    // Resync services
    const resynced = resyncAllServices();
    expect(resynced.length).toBe(5);
    expect(resynced.every((s) => s.status === 'OPERATIONAL' || s.status === 'SIMULATED')).toBe(true);
  });

  // TEST 4: Langfuse Multi-Modal Tracing Engine
  it('4. langfuse_multimodal_tracing: logs multi-modal attachments, calculates tokens, latency, cost, and updates feedback', () => {
    // Record multi-modal trace with audio attachment
    const trace = recordTrace({
      sessionId: 'sess-test-unit-01',
      tool: 'voice_agent',
      name: 'Unit Test Voice Turn',
      input: { text: 'Testing voice attachment' },
      output: { transcript: 'Voice turn confirmed' },
      model: 'GPT-Live (LiveKit)',
      tokens: { promptTokens: 14, completionTokens: 22, totalTokens: 36 },
      latencyMs: 145,
      costUsd: 0.00008,
      status: 'SUCCESS',
      attachments: [
        {
          type: 'audio',
          name: 'test-audio.wav',
          mimeType: 'audio/wav',
          url: 'data:audio/wav;base64,TESTING_BASE64',
          sizeBytes: 1024,
        },
      ],
    });

    expect(trace.id).toMatch(/^trc-voi-/);
    expect(trace.attachments?.length).toBe(1);
    expect(trace.attachments?.[0].type).toBe('audio');

    // Fetch traces
    const voiceTraces = getTraces('voice_agent');
    expect(voiceTraces.some((t) => t.id === trace.id)).toBe(true);

    // Update feedback thumbs up
    const updated = updateTraceFeedback(trace.id, 'thumbs_up');
    expect(updated?.feedback).toBe('thumbs_up');
    expect(getTraceById(trace.id)?.feedback).toBe('thumbs_up');
  });

  // TEST 5: Rock-Paper-Scissors Turn Evaluation
  it('5. rps_turn_evaluation: enforces game rules and score progression', () => {
    // Logic test
    const evaluateRps = (user: 'rock' | 'paper' | 'scissors', ai: 'rock' | 'paper' | 'scissors') => {
      if (user === ai) return 'DRAW';
      if (
        (user === 'rock' && ai === 'scissors') ||
        (user === 'paper' && ai === 'rock') ||
        (user === 'scissors' && ai === 'paper')
      ) {
        return 'WIN';
      }
      return 'LOSE';
    };

    expect(evaluateRps('rock', 'scissors')).toBe('WIN');
    expect(evaluateRps('paper', 'rock')).toBe('WIN');
    expect(evaluateRps('scissors', 'paper')).toBe('WIN');
    expect(evaluateRps('rock', 'paper')).toBe('LOSE');
    expect(evaluateRps('paper', 'scissors')).toBe('LOSE');
    expect(evaluateRps('scissors', 'rock')).toBe('LOSE');
    expect(evaluateRps('rock', 'rock')).toBe('DRAW');
  });

  // TEST 6: Sentiment Classification Heuristics
  it('6. sentiment_classification_heuristics: correctly separates positive satisfaction from dispute signals', () => {
    const classifySentiment = (text: string) => {
      const lower = text.toLowerCase();
      const pos = ['saved', 'instantaneous', 'delighted', 'great', 'success'];
      const neg = ['surprise', 'surcharge', 'late', 'delay', 'failed', 'dispute'];
      const pCount = pos.filter((w) => lower.includes(w)).length;
      const nCount = neg.filter((w) => lower.includes(w)).length;
      if (pCount > nCount) return 'POSITIVE';
      if (nCount > pCount) return 'NEGATIVE';
      return 'NEUTRAL';
    };

    expect(classifySentiment('The instantaneous settlement saved our procurement team time')).toBe('POSITIVE');
    expect(classifySentiment('The supplier added an unauthorized surcharge and was late')).toBe('NEGATIVE');
    expect(classifySentiment('The delivery was received on Thursday at 14:00 UTC')).toBe('NEUTRAL');
  });
});
