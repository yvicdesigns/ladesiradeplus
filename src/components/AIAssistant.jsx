import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, Sparkles, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const MAX_MESSAGES = 5;
const WINDOW_MS = 12 * 60 * 60 * 1000; // 12 heures
const STORAGE_KEY = 'ai_assistant_quota';

const getQuota = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, resetAt: Date.now() + WINDOW_MS };
    const quota = JSON.parse(raw);
    if (Date.now() > quota.resetAt) {
      const fresh = { count: 0, resetAt: Date.now() + WINDOW_MS };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return quota;
  } catch {
    return { count: 0, resetAt: Date.now() + WINDOW_MS };
  }
};

const incrementQuota = () => {
  const quota = getQuota();
  const updated = { ...quota, count: quota.count + 1 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

const POSITION_KEY = 'ai_assistant_position';

const getSavedPosition = () => {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    return raw ? JSON.parse(raw) : { x: 0, y: 0 };
  } catch { return { x: 0, y: 0 }; }
};

export const AIAssistant = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  // Only show for authenticated users
  if (!user) return null;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [messages, setMessages] = useState([]);
  const [quota, setQuota] = useState(getQuota);
  const [dragPosition, setDragPosition] = useState(getSavedPosition);
  const [isDragging, setIsDragging] = useState(false);
  const bottomRef = useRef(null);
  const dragRef = useRef(null);

  const language = i18n.language || 'fr';
  const remaining = MAX_MESSAGES - quota.count;
  const isLimitReached = remaining <= 0;

  const welcomeMsg = language === 'en'
    ? "👋 Hello! I'm your assistant at La Desirade Plus. What would you like to eat today? I can help you choose from our menu!"
    : "👋 Bonjour ! Je suis votre assistant La Desirade Plus. Qu'avez-vous envie de manger aujourd'hui ? Je peux vous aider à choisir parmi notre menu !";

  const limitMsg = language === 'en'
    ? "⏳ You've used your 5 messages for this session. Come back in 12 hours or go ahead and place your order!"
    : "⏳ Vous avez utilisé vos 5 messages pour cette période. Revenez dans 12h ou passez directement votre commande !";

  useEffect(() => {
    if (open && menuItems.length === 0) {
      supabase
        .from('menu_items')
        .select('name, price, description, is_available, is_promo, promo_discount, menu_categories(name)')
        .eq('is_available', true)
        .then(({ data }) => {
          if (data) setMenuItems(data.map(i => ({ ...i, category: i.menu_categories?.name })));
        });
    }
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: welcomeMsg }]);
    }
    // Refresh quota when opening
    if (open) setQuota(getQuota());
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading || isLimitReached) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const updated = incrementQuota();
    setQuota(updated);

    const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ message: userMsg, menuItems, language, conversationHistory: history }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        // Save custom request to DB for admin review
        if (data.customRequest) {
          supabase.from('customer_requests').insert({
            request_text: userMsg,
            suggested_dish: data.customRequest,
            status: 'new',
          });
        }
      } else throw new Error(data.error || 'No reply');
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: language === 'en' ? "Sorry, I'm having trouble. Please try again!" : "Désolé, une erreur est survenue. Réessayez !",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Compute hours left before reset
  const hoursLeft = Math.ceil((quota.resetAt - Date.now()) / (1000 * 60 * 60));

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            ref={dragRef}
            drag
            dragMomentum={false}
            dragElastic={0.1}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
            transition={{
              scale: { duration: 0.3 },
              opacity: { duration: 0.3 },
              y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              x: dragPosition.x,
              y: dragPosition.y,
              bottom: 'calc(4rem + env(safe-area-inset-bottom, 16px) + 16px)',
              right: '1rem',
            }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(_, info) => {
              setIsDragging(false);
              const newPos = { x: dragPosition.x + info.offset.x, y: dragPosition.y + info.offset.y };
              setDragPosition(newPos);
              localStorage.setItem(POSITION_KEY, JSON.stringify(newPos));
            }}
            onClick={() => { if (!isDragging) setOpen(true); }}
            className="fixed z-50 w-14 h-14 bg-[#D97706] hover:bg-[#B45309] text-white rounded-full shadow-xl shadow-amber-700/30 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
          >
            <MessageCircle className="w-6 h-6" />
            <span className={`absolute -top-1 -right-1 w-4 h-4 ${isLimitReached ? 'bg-gray-400' : 'bg-green-500'} rounded-full border-2 border-white`} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 z-50 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
            style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 16px) + 16px)', height: '480px' }}
          >
            {/* Header */}
            <div className="bg-[#D97706] px-3 py-3 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-3 py-1.5 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-white font-bold text-sm">Assistant IA</p>
              </div>
              {/* Quota indicator */}
              <div className="flex gap-1">
                {Array.from({ length: MAX_MESSAGES }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < quota.count ? 'bg-white/30' : 'bg-white'}`}
                  />
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-[#D97706] rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#D97706] text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 bg-[#D97706] rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
                    <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input or limit message */}
            <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
              {isLimitReached ? (
                <div className="text-center text-xs text-gray-500 py-2 px-3 bg-gray-50 rounded-2xl border border-gray-200">
                  {limitMsg}
                  <p className="mt-1 font-semibold text-[#D97706]">
                    {language === 'en' ? `Resets in ~${hoursLeft}h` : `Disponible dans ~${hoursLeft}h`}
                  </p>
                </div>
              ) : (
                <div className="flex gap-2 items-center bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200 focus-within:border-[#D97706] transition-colors">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={language === 'en' ? `Ask me anything… (${remaining} left)` : `Posez votre question… (${remaining} restant${remaining > 1 ? 's' : ''})`}
                    className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="w-8 h-8 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
