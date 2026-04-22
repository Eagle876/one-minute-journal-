import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage } from '../types';
import { generateAnonymousName } from '../utils/anonymous';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const anonymousName = user ? generateAnonymousName(user.uid) : 'Anonymous';

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chat_messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      
      setMessages(newMessages.reverse());
      setLoading(false);
      setErrorVisible(null);
    }, (error: any) => {
      console.error("Firestore Chat Error:", error);
      setErrorVisible(`Chat connection error: ${error.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const messageText = input.trim();
    setInput('');

    try {
      await addDoc(collection(db, 'chat_messages'), {
        userId: user.uid,
        userName: anonymousName,
        message: messageText,
        createdAt: serverTimestamp()
      });
      setErrorVisible(null);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setErrorVisible(`Failed to send message: ${error.message}`);
    }
  };

  return (
    <div className="h-[calc(100vh-14rem)] flex flex-col card rounded-3xl overflow-hidden shadow-2xl">
      <header className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--accent)]/5">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl accent-bg text-white">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="font-bold">Community Chat</h2>
            <p className="text-xs opacity-50">Anonymous & Supportive</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold opacity-30">Your Identity</span>
          <span className="text-xs font-medium text-[var(--accent)]">{anonymousName}</span>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/[0.02]">
        {errorVisible && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs mb-4">
            {errorVisible}
          </div>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <Loader2 className="animate-spin mb-2" />
            <p>Connecting to community...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-10">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="text-sm">No messages yet. Be the first to share some kindness!</p>
          </div>
        ) : null}
        
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.userId === user?.uid;
            const date = msg.createdAt instanceof Timestamp ? msg.createdAt.toDate() : new Date();
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[80%] p-4 rounded-2xl shadow-sm
                  ${isMe 
                    ? 'accent-bg text-white rounded-tr-none' 
                    : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text)] rounded-tl-none'}
                `}>
                  {!isMe && (
                    <p className="text-[10px] font-bold uppercase opacity-50 mb-1">
                      {msg.userName}
                    </p>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-[10px] mt-1 opacity-50 ${isMe ? 'text-white/70' : ''}`}>
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a supportive message..."
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-black/[0.02]"
          />
          <button
            type="submit"
            disabled={!input.trim() || !user}
            className="p-3 rounded-xl accent-bg text-white disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
