import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { sendChatMessage, ChatMessageItem } from '../services/aiSuiteService';
import {
  saveChatMessageToFirestore,
  loadChatMessagesFromFirestore,
} from '../firebase/firestoreService';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Zap,
  BrainCircuit,
  Cpu,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

export const AIChatBot: React.FC = () => {
  const { user, mode, currency } = useFinance();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Model selection per instruction:
  // - gemini-3.1-pro-preview for complex tasks
  // - gemini-3.5-flash for general tasks
  // - gemini-3.1-flash-lite for fast tasks
  const [selectedModel, setSelectedModel] = useState<
    'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite'
  >('gemini-3.5-flash');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from Firestore on mount if user logged in
  useEffect(() => {
    let isMounted = true;
    if (user?.userId) {
      loadChatMessagesFromFirestore(user.userId).then((stored) => {
        if (isMounted && stored.length > 0) {
          setMessages(
            stored.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.text,
              timestamp: m.timestamp,
              modelUsed: m.modelUsed,
            }))
          );
        } else if (isMounted && stored.length === 0) {
          // Welcome greeting
          const welcomeMsg: ChatMessageItem = {
            id: 'init_welcome',
            role: 'model',
            content:
              mode === 'sme'
                ? `Hello ${user.name.split(' ')[0]}! I am your AI SME CFO & Cash Flow Strategist powered by Google Gemini. Ask me about burn rate optimization, cash flow runways, vendor negotiation, or financial forecasting.`
                : `Hello ${user.name.split(' ')[0]}! I am your evidence-based Financial Advisor powered by Gemini. You can ask me how to optimize your spending, audit recurring subscriptions, plan emergency savings, or test budget scenarios in ${currency}.`,
            timestamp: Date.now(),
            modelUsed: selectedModel,
          };
          setMessages([welcomeMsg]);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user?.userId, mode, currency]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || loading) return;

    const userMsg: ChatMessageItem = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (user?.userId) {
      saveChatMessageToFirestore(user.userId, {
        id: userMsg.id!,
        role: 'user',
        text: userMsg.content,
        timestamp: userMsg.timestamp!,
      });
    }

    try {
      const response = await sendChatMessage({
        message: promptText,
        history: messages,
        model: selectedModel,
        mode: mode,
      });

      const aiMsg: ChatMessageItem = {
        id: `msg_a_${Date.now()}`,
        role: 'model',
        content: response.reply,
        timestamp: Date.now(),
        modelUsed: response.modelUsed || selectedModel,
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (user?.userId) {
        saveChatMessageToFirestore(user.userId, {
          id: aiMsg.id!,
          role: 'model',
          text: aiMsg.content,
          timestamp: aiMsg.timestamp!,
          modelUsed: aiMsg.modelUsed,
        });
      }
    } catch (err: any) {
      const errorMsg: ChatMessageItem = {
        id: `msg_err_${Date.now()}`,
        role: 'model',
        content: `Error: ${err.message || 'Could not communicate with Gemini model'}. Please check your connection.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts =
    mode === 'sme'
      ? [
          'How do I calculate and stretch our operational runway by 3 months?',
          'What are high-impact strategies to trim software SaaS bloat?',
          'How can we renegotiate payment terms with key B2B vendors?',
        ]
      : [
          'What is the best way to distribute my income using 50/30/20 rule?',
          'How can I audit and eliminate repeated micro-expenses?',
          'Should I aggressively pay down high-interest debt or invest first?',
        ];

  return (
    <div className="flex flex-col h-[650px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Gemini Financial Chatbot
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Multi-Turn Thread
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Role: {mode === 'sme' ? 'SME Chief Financial Officer (CFO)' : 'Evidence-Based Personal Financial Advisor'}
            </p>
          </div>
        </div>

        {/* Model Selector & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                selectedModel === 'gemini-3.1-pro-preview'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="gemini-3.1-pro-preview: Deep reasoning for complex calculations and audits"
            >
              <BrainCircuit className="w-3 h-3" />
              <span>Pro</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.5-flash')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                selectedModel === 'gemini-3.5-flash'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="gemini-3.5-flash: General financial tasks & comprehensive balance"
            >
              <Cpu className="w-3 h-3" />
              <span>Flash</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="gemini-3.1-flash-lite: Ultra-fast snappy advice"
            >
              <Zap className="w-3 h-3" />
              <span>Lite</span>
            </button>
          </div>

          <button
            type="button"
            onClick={clearChat}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
            title="Clear Chat Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Thread (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id || index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                  isUser
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-xs shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] opacity-70">
                  <span>
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just now'}
                    {msg.modelUsed && ` • ${msg.modelUsed}`}
                  </span>
                  {!isUser && msg.id && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(msg.id!, msg.content)}
                      className="hover:opacity-100 p-0.5"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              <span
                className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
              <span className="ml-1 font-medium">Gemini is reasoning with {selectedModel}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      {messages.length < 3 && (
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-medium whitespace-nowrap">Suggested:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${selectedModel} about your ${mode === 'sme' ? 'business cash flow' : 'personal finances'}...`}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
