import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Maximize2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aiApi, AiChatResponse } from '../../api/ai.api';
import HubMateBot from './HubMateBot';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const FloatingAiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Hub Mate, your personal wealth copilot. Ask me anything about your net worth, liquidity, emergency buffer, or rebalancing needs!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    "What is my net worth?",
    "How much cash/liquidity do I have?",
    "Is my portfolio balanced?",
    "How is my emergency fund?"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: messageText }];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const history = newMessages.slice(1, -1).map(m => ({ role: m.role, content: m.content }));
      const response: AiChatResponse = await aiApi.chat({
        message: messageText,
        history
      });

      setMessages([...newMessages, { role: 'assistant', content: response.reply }]);
      if (response.suggestedFollowUps && response.suggestedFollowUps.length > 0) {
        setSuggestedPrompts(response.suggestedFollowUps);
      }
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "I'm having trouble analyzing your request right now. Please check your network and try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 right-20 md:right-24 z-40">
      {/* Floating Animated Hub Mate Trigger */}
      {!isOpen && (
        <div className="relative group">
          {/* Tooltip Speech Badge */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md text-white text-xs font-medium rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap flex items-center gap-2 border border-slate-700/80">
            <span>Ask Hub Mate</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-slate-950 hover:bg-slate-900 border-2 border-indigo-500/70 hover:border-indigo-400 rounded-full shadow-2xl hover:shadow-indigo-500/25 transition-all flex items-center justify-center relative overflow-hidden group focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
            title="Open Hub Mate Copilot"
          >
            {/* Ambient Radial Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/30 via-slate-900 to-sky-500/20 opacity-90" />

            {/* Hovering Hub Mate */}
            <HubMateBot size="sm" interactive={false} />

            {/* Online Status Dot */}
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full shadow-xs" />
          </button>
        </div>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 md:right-24 z-50 w-[calc(100vw-2rem)] sm:w-[410px] max-w-[410px] h-[530px] max-h-[75vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-slate-900 text-white p-3.5 px-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-950 border border-indigo-500/40 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                <HubMateBot size="mini" isThinking={loading} interactive={false} />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight flex items-center gap-1.5">
                  <span>Hub Mate</span>
                  <span className="text-[9px] font-mono font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-1.5 py-0.5 rounded-full">
                    {loading ? 'THINKING' : 'ONLINE'}
                  </span>
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Grounded wealth copilot</span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/assistant');
                }}
                className="flex items-center gap-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-lg transition-colors shadow-sm"
                title="Open Detailed View"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Detailed View</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-slate-900 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden shadow-xs">
                    <HubMateBot size="mini" interactive={false} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-sm ml-auto'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-slate-900 border border-indigo-500/40 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  <HubMateBot size="mini" isThinking={true} interactive={false} />
                </div>
                <div className="bg-white text-slate-600 border border-slate-200 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center space-x-2 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Hub Mate is analyzing your live portfolio...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {suggestedPrompts.length > 0 && !loading && (
            <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar">
              {suggestedPrompts.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="whitespace-nowrap bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[11px] text-slate-700 hover:text-indigo-700 px-2.5 py-1 rounded-full transition-colors shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your finances..."
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-colors flex items-center justify-center shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
