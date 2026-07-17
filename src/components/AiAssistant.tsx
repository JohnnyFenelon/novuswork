import { useEffect, useRef, useState } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { api } from '../api';
import { useT } from '../i18n';

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  context?: string;
}

export default function AiAssistant({ context }: Props) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: 'assistant', content: t('ai.welcome') },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Auto-scroll on new messages */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* Focus input when panel opens */
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: AiMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await api<{ reply: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, context: context || '' }),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('ai.error') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Expanded chat panel ── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-80 h-[28rem] bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          open ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold text-sm">{t('ai.title')}</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-3 space-y-3 bg-gray-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-line break-words">{m.content}</p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-100 flex gap-2">
          <input
            ref={inputRef}
            className="flex-1 border border-gray-300 rounded-full py-2.5 px-4 outline-none focus:border-primary text-sm"
            placeholder={t('ai.inputph')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Floating trigger button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary hover:bg-primary-dark text-white shadow-lg flex items-center justify-center transition-all duration-300 ${
          open ? 'rotate-0' : 'animate-pulse shadow-primary/40'
        }`}
        aria-label={t('ai.title')}
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>
    </>
  );
}
