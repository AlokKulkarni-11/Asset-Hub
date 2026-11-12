import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, ArrowRight, ArrowLeft, Activity, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aiApi, AiChatResponse } from '../api/ai.api';
import { healthScoreApi, HealthScoreResponse } from '../api/healthScore.api';
import HubMateBot from '../components/ai/HubMateBot';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  referencedDataPoints?: string[];
}

const HUB_MATE_INSIGHTS = [
  "Analyzing real-time asset allocations. What would you like to explore? 📊",
  "I compute Sharpe ratios, emergency buffers & tax efficiency across all asset classes! 💡",
  "Zero hallucinations: every answer is grounded strictly in your live database ledger. 🛡️",
  "Tip: Ask me 'How safe is my portfolio from a liquidity perspective?' 🚀",
  "I can audit your loan interest costs and simulate prepayment scenarios. ⚡",
];

export const AiAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am Hub Mate, your wealth copilot. I analyze your actual portfolio data in real-time to answer questions on asset allocation, liabilities, emergency buffers, and net worth growth. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [healthScore, setHealthScore] = useState<HealthScoreResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [insightIdx, setInsightIdx] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const cycleInsight = () => {
    setInsightIdx((prev) => (prev + 1) % HUB_MATE_INSIGHTS.length);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        setHealthLoading(true);
        const data = await healthScoreApi.getHealthScore();
        setHealthScore(data);
      } catch (e) {
        console.error(e);
      } finally {
        setHealthLoading(false);
      }
    };
    loadHealth();
  }, []);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const history = newMessages.slice(1, -1).map(m => ({ role: m.role, content: m.content }));
      const res: AiChatResponse = await aiApi.chat({
        message: textToSend,
        history
      });

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: res.reply,
          referencedDataPoints: res.referencedDataPoints
        }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "Sorry, I encountered an error while processing your request. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const presetQuestions = [
    "What is my current net worth breakdown?",
    "How safe is my portfolio from a liquidity perspective?",
    "Do I need to rebalance my portfolio right now?",
    "How many months of expenses can my emergency fund cover?",
    "What are my largest financial vulnerabilities?"
  ];

  return (
    <div className="h-full flex flex-col min-h-0 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="shrink-0 mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-indigo-500/40 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
              <HubMateBot size="mini" interactive={false} />
            </div>
            <span>Hub Mate</span>
            <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-1 hidden sm:inline-block">
              Grounded AI
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Grounded personal wealth copilot reasoning strictly over your live portfolio data
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Main Content: Fit to remaining height without outer scrollbars */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Companion Bot, Vitals & Inquiries */}
        <div className="lg:col-span-4 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
          {/* Hub Mate Active Persona Companion Card */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border border-indigo-500/30 rounded-2xl p-4 shadow-sm shrink-0 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />

            <HubMateBot
              size="md"
              isThinking={loading}
              interactive={true}
              showDialogue={true}
              dialogueText={
                loading
                  ? "Consulting live ledger records & computing metrics... 📡"
                  : HUB_MATE_INSIGHTS[insightIdx]
              }
              onDialogueClick={cycleInsight}
              className="mb-1"
            />

            <div className="mt-1 flex items-center justify-between w-full border-t border-slate-800/80 pt-2.5 text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Copilot AI Engine</span>
              </span>
              <span className="font-mono text-indigo-300 text-[10px] bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                v2.4 Grounded
              </span>
            </div>
          </div>

          {/* Portfolio Vital Signs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">Portfolio Vital Signs</h3>
            {healthLoading ? (
              <div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
            ) : healthScore ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-900">{healthScore.overallScore}</span>
                    <span className="text-xs text-slate-400 font-medium">/100</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Health Grade: <strong className="text-indigo-600">{healthScore.grade}</strong></p>
                  </div>
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Debt-to-Asset:</span>
                    <span className="font-semibold text-slate-800">{Number(healthScore.debtToAssetRatioPct || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Liquidity Allocation:</span>
                    <span className="font-semibold text-slate-800">{Number(healthScore.liquidPercentage || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Max Asset Concentration:</span>
                    <span className="font-semibold text-slate-800">{Number(healthScore.maxAssetClassConcentrationPct || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Emergency Buffer:</span>
                    <span className="font-semibold text-slate-800">{Number(healthScore.emergencyFundMonthsCovered || 0).toFixed(1)} months</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 shrink-0">Suggested Inquiries</h3>
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {presetQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-xs text-slate-700 hover:text-indigo-900 transition-colors flex items-center justify-between group"
                >
                  <span className="line-clamp-2">{q}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Chat Container */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-0 h-full overflow-hidden">
          {/* Scrollable messages area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50 min-h-0">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-950 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5 shadow-xs overflow-hidden">
                    <HubMateBot size="mini" interactive={false} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-sm ml-auto'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.referencedDataPoints && m.referencedDataPoints.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase w-full">Referenced Metrics:</span>
                      {m.referencedDataPoints.map((dp, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {dp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="p-2 bg-slate-800 text-white rounded-xl shadow-sm shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-950 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5 shadow-xs overflow-hidden">
                  <HubMateBot size="mini" isThinking={true} interactive={false} />
                </div>
                <div className="bg-white text-slate-600 border border-slate-200 rounded-2xl rounded-bl-none p-3.5 shadow-sm flex items-center space-x-2 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Hub Mate is querying your portfolio records & computing metrics...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center space-x-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your portfolio, debts, or emergency runway..."
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center justify-center space-x-1.5 shrink-0 shadow-sm"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
