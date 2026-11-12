'use client';

import { useState } from 'react';
import { MainNav } from '@/app/components/main-nav';
import { getTraces, type LangfuseTrace, type LangfuseToolType } from '@/lib/langfuse-tracer';
import {
  Sparkles,
  MessageSquare,
  Mic,
  Image as ImageIcon,
  Smile,
  Gamepad2,
  ListFilter,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  X,
  Download,
} from 'lucide-react';

export default function AiSandboxPage() {
  const [activeTab, setActiveTab] = useState<LangfuseToolType>('qna_chatbot');
  const [traces, setTraces] = useState<LangfuseTrace[]>(() => getTraces());
  const [selectedTrace, setSelectedTrace] = useState<LangfuseTrace | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'thumbs_up' | 'thumbs_down'>>({});

  // 1. Chatbot state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; traceId?: string }>>([
    {
      role: 'assistant',
      text: 'Do you have any questions about VeriSettle & Langfuse? Ask me 😊',
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // 2. Voice Agent state
  const [isRecording, setIsRecording] = useState(false);
  const [storeAudio, setStoreAudio] = useState(true);
  const [voiceLog, setVoiceLog] = useState<string[]>([]);
  const [voiceLoading, setVoiceLoading] = useState(false);

  // 3. Image Generator state
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number>(3);
  const [imageError, setImageError] = useState<string | null>(null);

  // 4. Sentiment state
  const [sentimentText, setSentimentText] = useState('');
  const [sentimentResult, setSentimentResult] = useState<{
    sentiment: string;
    confidence: number;
    keywords: string[];
  } | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);

  // 5. Rock-Paper-Scissors state
  const [rpsRound, setRpsRound] = useState(1);
  const [rpsScore, setRpsScore] = useState({ user: 0, ai: 0 });
  const [rpsHistory, setRpsHistory] = useState<
    Array<{ round: number; userMove: string; aiMove: string; outcome: string }>
  >([]);
  const [rpsLoading, setRpsLoading] = useState(false);

  const [sessionId, setSessionId] = useState('sess-live-sandbox-telemetry');

  // Fetch recent traces
  const fetchTraces = async () => {
    try {
      const res = await fetch('/api/ai/traces');
      if (res.ok) {
        const data = await res.json();
        setTraces(data.traces || []);
      }
    } catch {
      // Ignore background error
    }
  };

  // 1. Submit Chat
  const handleSendChat = async (presetText?: string) => {
    const text = presetText || chatInput;
    if (!text.trim() || chatLoading) return;

    const newMsgs = [...chatMessages, { role: 'user' as const, text }];
    setChatMessages(newMsgs);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages([...newMsgs, { role: 'assistant', text: data.answer, traceId: data.traceId }]);
        fetchTraces();
      }
    } catch {
      setChatMessages([
        ...newMsgs,
        {
          role: 'assistant',
          text: 'Error contacting AI assistant. Verification fallback active: All settlement operations are protected by FIPS 180-4 SHA-256 digests.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Chat feedback
  const handleFeedback = async (traceId: string, feedback: 'thumbs_up' | 'thumbs_down') => {
    setFeedbackMap((prev) => ({ ...prev, [traceId]: feedback }));
    try {
      await fetch('/api/ai/traces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traceId, feedback }),
      });
      fetchTraces();
    } catch {
      // Ignore
    }
  };

  // 2. Voice Agent Turn
  const handleVoiceToggle = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    setVoiceLoading(true);

    // Speak / simulate microphone audio
    setTimeout(async () => {
      try {
        const res = await fetch('/api/ai/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'Query escrow authorization status for PO-ESCROW-2026-X88',
            storeAudio,
            sessionId,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setVoiceLog((prev) => [
            ...prev,
            `User: "Query escrow authorization status for PO-ESCROW-2026-X88"`,
            `Agent: "${data.transcript}" (Trace: ${data.traceId})`,
          ]);

          // Browser speech synthesis if supported
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const utter = new SpeechSynthesisUtterance(data.transcript);
            utter.rate = 1.05;
            window.speechSynthesis.speak(utter);
          }
          fetchTraces();
        }
      } catch {
        setVoiceLog((prev) => [...prev, 'LiveKit voice stream failed to connect.']);
      } finally {
        setIsRecording(false);
        setVoiceLoading(false);
      }
    }, 1800);
  };

  // 3. Image Generation
  const handleGenerateImage = async (presetPrompt?: string) => {
    const prompt = presetPrompt || imagePrompt;
    if (!prompt.trim() || imageLoading) return;

    setImageLoading(true);
    setImageError(null);

    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedImage(data.imageUrl);
        setRateLimitRemaining(data.rateLimitRemaining);
        fetchTraces();
      } else {
        const errData = await res.json();
        setImageError(errData.error || 'Rate limit reached or generation error.');
      }
    } catch {
      setImageError('Failed to generate image.');
    } finally {
      setImageLoading(false);
    }
  };

  // 4. Sentiment Analysis
  const handleAnalyzeSentiment = async (presetSentence?: string) => {
    const text = presetSentence || sentimentText;
    if (!text.trim() || sentimentLoading) return;

    setSentimentLoading(true);
    try {
      const res = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSentimentResult({
          sentiment: data.sentiment,
          confidence: data.confidence,
          keywords: data.keywords,
        });
        fetchTraces();
      }
    } catch {
      // Ignore
    } finally {
      setSentimentLoading(false);
    }
  };

  // 5. Rock-Paper-Scissors Move
  const handlePlayRps = async (move: 'rock' | 'paper' | 'scissors') => {
    if (rpsLoading) return;
    setRpsLoading(true);

    try {
      const res = await fetch('/api/ai/rps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          move,
          round: rpsRound,
          sessionId,
          currentScore: rpsScore,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRpsRound(data.round);
        setRpsScore(data.score);
        setRpsHistory((prev) => [
          { round: rpsRound, userMove: data.userMove, aiMove: data.aiMove, outcome: data.outcome },
          ...prev,
        ]);
        fetchTraces();
      }
    } catch {
      // Ignore
    } finally {
      setRpsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <MainNav />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Langfuse Launch Week #2 Day 3 Multi-Modal Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Multi-Modal Playground &amp; Observability Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Interactive test bench featuring streaming Q&amp;A, full-duplex voice, image synthesis, sentiment classification &amp; turn-based games.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono text-slate-400 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              Session: <strong className="text-blue-400">{sessionId.substring(0, 14)}...</strong>
            </span>
            <button
              onClick={fetchTraces}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh Traces"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5-Tool Navigation Bar */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('qna_chatbot')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'qna_chatbot' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Q&amp;A Chatbot</span>
          </button>

          <button
            onClick={() => setActiveTab('voice_agent')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'voice_agent' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice Agent (LiveKit)</span>
          </button>

          <button
            onClick={() => setActiveTab('image_generator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'image_generator' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image Generator</span>
          </button>

          <button
            onClick={() => setActiveTab('sentiment_analyzer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'sentiment_analyzer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>Sentiment Analyzer</span>
          </button>

          <button
            onClick={() => setActiveTab('rps_game')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'rps_game' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Rock-Paper-Scissors</span>
          </button>
        </div>

        {/* Tool Playground Views */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Tool Area (7 cols on desktop) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            {/* 1. Q&A CHATBOT */}
            {activeTab === 'qna_chatbot' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <span>Ask me 😊 · VeriSettle &amp; Langfuse Assistant</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Streaming markdown Q&amp;A instrumented with token counts and cost evaluation.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    gpt-3.5-turbo
                  </span>
                </div>

                {/* Warning Banner as specified in Langfuse docs */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>⚠️ Warning:</strong> Do not enter sensitive information. All chat messages and tool executions can be viewed in the live public Langfuse trace inspector.
                  </span>
                </div>

                {/* Preset Clickable Suggestion Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Suggested Questions:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'What can I use Langfuse for?',
                      'How do I link my prompts to my traces?',
                      'How does VeriSettle 3-way matching verify invoices?',
                      'What is an AP2 Spend Mandate?',
                    ].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => handleSendChat(chip)}
                        className="text-[11px] px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors text-left cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat History Pane */}
                <div className="h-72 overflow-y-auto space-y-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  {chatMessages.map((msg, i) => {
                    const isAssistant = msg.role === 'assistant';
                    return (
                      <div
                        key={i}
                        className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                            isAssistant
                              ? 'bg-blue-600/20 text-slate-100 border border-blue-500/30 rounded-tl-xs'
                              : 'bg-slate-800 text-white rounded-tr-xs'
                          }`}
                        >
                          {msg.text}
                        </div>

                        {/* Thumbs Up / Down Feedback */}
                        {isAssistant && msg.traceId && (
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 px-1">
                            <span className="text-[10px] font-mono text-slate-500">trace: {msg.traceId.substring(0, 12)}...</span>
                            <button
                              onClick={() => handleFeedback(msg.traceId!, 'thumbs_up')}
                              className={`p-1 rounded hover:bg-slate-800 cursor-pointer ${
                                feedbackMap[msg.traceId] === 'thumbs_up' ? 'text-emerald-400 font-bold' : 'text-slate-400'
                              }`}
                              title="Helpful trace"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.traceId!, 'thumbs_down')}
                              className={`p-1 rounded hover:bg-slate-800 cursor-pointer ${
                                feedbackMap[msg.traceId] === 'thumbs_down' ? 'text-red-400 font-bold' : 'text-slate-400'
                              }`}
                              title="Needs review"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {chatLoading && (
                    <div className="flex items-center gap-2 text-xs text-blue-400 font-mono">
                      <span className="size-2 rounded-full bg-blue-400 animate-ping" />
                      <span>Langfuse streaming trace generating...</span>
                    </div>
                  )}
                </div>

                {/* Input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ask a question about Langfuse, 3-way matching, or PayPal escrow..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* 2. VOICE AGENT */}
            {activeTab === 'voice_agent' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Mic className="w-4 h-4 text-purple-400" />
                      <span>LiveKit / GPT-Live Voice Agent</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Full-duplex conversational voice turn with audio trace attachments.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                    Powered by LiveKit Agents
                  </span>
                </div>

                {/* Option Toggle: Store audio recording on trace */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-white">Store audio recording on the trace</span>
                    <p className="text-[11px] text-slate-400">
                      When enabled, encodes binary audio bytes (WAV RIFF) into the Langfuse media attachment payload.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={storeAudio}
                    onChange={(e) => setStoreAudio(e.target.checked)}
                    className="size-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* Mic Action Area */}
                <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="relative">
                    {isRecording && (
                      <div className="absolute inset-0 size-20 rounded-full bg-red-500/30 animate-ping -m-1" />
                    )}
                    <button
                      onClick={handleVoiceToggle}
                      disabled={voiceLoading}
                      className={`relative size-18 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer ${
                        isRecording
                          ? 'bg-red-600 text-white hover:bg-red-500'
                          : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      <Mic className={`w-8 h-8 ${isRecording ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-white">
                      {isRecording ? 'Listening & Synthesizing Speech...' : 'Click to Start Voice Conversation'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {isRecording
                        ? 'Capturing microphone audio stream via WebRTC / LiveKit OTel'
                        : 'Simulates interactive audio dialog for escrow inquiries'}
                    </p>
                  </div>
                </div>

                {/* Conversation Log */}
                {voiceLog.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-slate-400">Voice Transcripts:</span>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs font-mono">
                      {voiceLog.map((log, idx) => (
                        <div
                          key={idx}
                          className={log.startsWith('Agent:') ? 'text-blue-300' : 'text-slate-400'}
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. IMAGE GENERATOR */}
            {activeTab === 'image_generator' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>Multi-Modal Image Generator</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Creates visual assets with multi-modal Langfuse trace image attachments.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    GPT-Image-2.5 Flare
                  </span>
                </div>

                {/* Rate limit note */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                  <span>Powered by GPT-Image-2.5 Flare. Limited to 3 generations/minute.</span>
                  <span className="font-mono text-blue-400 font-semibold">{rateLimitRemaining} / 3 remaining</span>
                </div>

                {/* Preset Prompt Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Sample Prompts:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'A futuristic holographic B2B escrow vault with glowing blue data streams',
                      'A cat wearing a space helmet floating in an asteroid belt',
                      'A detailed financial invoice audit dashboard in cyberpunk style',
                    ].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setImagePrompt(preset);
                          handleGenerateImage(preset);
                        }}
                        className="text-[11px] px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-left cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Input Form */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Describe the image you want to generate..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleGenerateImage()}
                    disabled={imageLoading}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {imageLoading ? 'Synthesizing...' : 'Generate'}
                  </button>
                </div>

                {imageError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {imageError}
                  </div>
                )}

                {/* Generated Image Preview Area */}
                {generatedImage && (
                  <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-slate-800/80 max-h-72 flex items-center justify-center bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={generatedImage}
                        alt="Generated AI asset"
                        className="max-h-64 object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-[11px] truncate max-w-sm">Prompt: {imagePrompt}</span>
                      <a
                        href={generatedImage}
                        download="langfuse-generated-artifact.svg"
                        className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download SVG</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. SENTIMENT ANALYZER */}
            {activeTab === 'sentiment_analyzer' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Smile className="w-4 h-4 text-amber-400" />
                      <span>Customer Feedback Sentiment Classifier</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Powered by TypeSafe Jev model; all input texts and scores logged to Langfuse.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    TypeSafe Jev
                  </span>
                </div>

                {/* Preset Example Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Click a preset feedback case:</span>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        label: 'Positive Case',
                        text: 'The automated escrow release was instantaneous and saved our procurement team 14 hours this week!',
                      },
                      {
                        label: 'Negative Case',
                        text: 'The supplier invoice had a 15% surprise surcharge and the delivery was 3 weeks late.',
                      },
                      {
                        label: 'Neutral Case',
                        text: 'The delivery receipt for PO-2026-8812 was logged on Thursday at 14:00 UTC.',
                      },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          setSentimentText(preset.text);
                          handleAnalyzeSentiment(preset.text);
                        }}
                        className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left text-xs transition-colors cursor-pointer group"
                      >
                        <span className="font-semibold text-blue-400 block group-hover:text-blue-300">
                          {preset.label}:
                        </span>
                        <span className="text-slate-300 italic">&ldquo;{preset.text}&rdquo;</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Text Area */}
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Enter or paste customer feedback, review, or invoice dispute message..."
                    value={sentimentText}
                    onChange={(e) => setSentimentText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleAnalyzeSentiment()}
                    disabled={sentimentLoading}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {sentimentLoading ? 'Analyzing...' : 'Analyze Sentiment'}
                  </button>
                </div>

                {/* Sentiment Result Gauge */}
                {sentimentResult && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Classification Outcome</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                          sentimentResult.sentiment === 'POSITIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : sentimentResult.sentiment === 'NEGATIVE'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {sentimentResult.sentiment}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Confidence Score</span>
                        <span className="font-mono font-bold text-white">
                          {(sentimentResult.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            sentimentResult.sentiment === 'POSITIVE'
                              ? 'bg-emerald-500'
                              : sentimentResult.sentiment === 'NEGATIVE'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${sentimentResult.confidence * 100}%` }}
                        />
                      </div>
                    </div>

                    {sentimentResult.keywords.length > 0 && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span>Attributed signals:</span>
                        {sentimentResult.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 5. ROCK-PAPER-SCISSORS GAME */}
            {activeTab === 'rps_game' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-blue-400" />
                      <span>Rock–Paper–Scissors Turn-Based Agent</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      One trace per round, one session per game logged to Langfuse.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                    Opponent: GPT-6 Astra
                  </span>
                </div>

                {/* Scoreboard and Round indicator */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-mono text-blue-400 uppercase tracking-wider">
                      Current Stage
                    </span>
                    <div className="text-base font-bold text-white">Round {rpsRound}</div>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Scoreboard</span>
                    <div className="text-2xl font-black font-mono tracking-wider text-white">
                      <span className="text-emerald-400">{rpsScore.user}</span> : <span className="text-red-400">{rpsScore.ai}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">You vs. GPT-6 Astra</span>
                  </div>

                  <button
                    onClick={() => {
                      setRpsRound(1);
                      setRpsScore({ user: 0, ai: 0 });
                      setRpsHistory([]);
                      setSessionId('sess-rps-game-next');
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                  >
                    Reset Game
                  </button>
                </div>

                {/* Move Selection Buttons */}
                <div className="space-y-2 text-center">
                  <span className="text-xs text-slate-400">Choose your move for Round {rpsRound}:</span>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { move: 'rock', emoji: '✊', label: 'Rock' },
                      { move: 'paper', emoji: '✋', label: 'Paper' },
                      { move: 'scissors', emoji: '✌️', label: 'Scissors' },
                    ].map((btn) => (
                      <button
                        key={btn.move}
                        disabled={rpsLoading}
                        onClick={() => handlePlayRps(btn.move as 'rock' | 'paper' | 'scissors')}
                        className="p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 flex flex-col items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <span className="text-3xl sm:text-4xl">{btn.emoji}</span>
                        <span className="text-xs font-bold text-slate-200">{btn.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Round history log */}
                {rpsHistory.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-slate-400">Rounds Summary:</span>
                    <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-xs">
                      {rpsHistory.slice(0, 5).map((h, i) => (
                        <div key={i} className="p-2.5 flex items-center justify-between">
                          <span className="font-mono text-slate-400">Round {h.round}</span>
                          <span className="text-slate-300">
                            You: <strong className="text-white capitalize">{h.userMove}</strong> vs. AI: <strong className="text-white capitalize">{h.aiMove}</strong>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                              h.outcome === 'WIN'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : h.outcome === 'LOSE'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {h.outcome}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live Langfuse Trace Log (5 cols on desktop) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-blue-400" />
                  <span>Langfuse Multi-Modal Traces</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time telemetry stream across all 5 sandbox mini-apps.
                </p>
              </div>
              <span className="text-xs font-mono text-blue-400 font-bold">
                {traces.length} Traces
              </span>
            </div>

            {/* Trace List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {traces.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No traces recorded yet. Execute any tool above to trigger live telemetry!
                </div>
              ) : (
                traces.map((trc) => {
                  const hasMedia = (trc.attachments && trc.attachments.length > 0);
                  const isSelected = selectedTrace?.id === trc.id;
                  return (
                    <div
                      key={trc.id}
                      onClick={() => setSelectedTrace(trc)}
                      className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white truncate max-w-[170px]">
                          {trc.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {new Date(trc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-blue-400">{trc.model}</span>
                          <span>·</span>
                          <span>{trc.latencyMs}ms</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {hasMedia && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              media
                            </span>
                          )}
                          <span className="font-mono text-emerald-400">
                            ${trc.costUsd.toFixed(5)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Trace Inspector Drawer */}
            {selectedTrace && (
              <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="font-bold text-xs text-white">Trace Details</div>
                  <button
                    onClick={() => setSelectedTrace(null)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="text-slate-400">
                    ID: <span className="text-white">{selectedTrace.id}</span>
                  </div>
                  <div className="text-slate-400">
                    Tokens: <span className="text-emerald-400">{selectedTrace.tokens.totalTokens}</span> ({selectedTrace.tokens.promptTokens} prompt + {selectedTrace.tokens.completionTokens} completion)
                  </div>
                  <div className="text-slate-400">
                    Input: <span className="text-slate-200">{typeof selectedTrace.input === 'string' ? selectedTrace.input : JSON.stringify(selectedTrace.input)}</span>
                  </div>
                  <div className="text-slate-400">
                    Output: <span className="text-slate-200">{typeof selectedTrace.output === 'string' ? selectedTrace.output : JSON.stringify(selectedTrace.output)}</span>
                  </div>
                </div>

                {selectedTrace.attachments && selectedTrace.attachments.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <span className="text-[11px] font-semibold text-purple-400">Multi-Modal Attachments:</span>
                    {selectedTrace.attachments.map((att, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between">
                        <span>{att.name} ({att.mimeType})</span>
                        {att.url && (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
