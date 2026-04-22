import React, { useState, useEffect } from 'react';
import VoiceRecorder from '../components/VoiceRecorder';
import { getRandomQuote } from '../constants/quotes';
import { motion } from 'motion/react';
import { Quote, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { isSameDay, subDays } from 'date-fns';

export default function Home() {
  const { user } = useAuth();
  const [quote, setQuote] = useState<{ quote: string; author: string } | null>(null);
  const [lastEntry, setLastEntry] = useState<{ mood: string; insight: string } | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setQuote(getRandomQuote());
    fetchStreak();
  }, [user]);

  const fetchStreak = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'journals'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const dates = querySnapshot.docs
        .map(doc => doc.data().created_at?.toDate())
        .filter(Boolean)
        .sort((a, b) => b.getTime() - a.getTime());

      if (dates.length === 0) {
        setStreak(0);
        return;
      }

      // Remove duplicate days
      const uniqueDates: Date[] = [];
      dates.forEach(date => {
        if (!uniqueDates.some(d => isSameDay(d, date))) {
          uniqueDates.push(date);
        }
      });

      let currentStreak = 0;
      let checkDate = new Date();

      // Check if they recorded today
      const recordedToday = uniqueDates.some(d => isSameDay(d, checkDate));
      
      if (!recordedToday) {
        // If not today, check if they recorded yesterday to keep the streak alive
        checkDate = subDays(checkDate, 1);
        const recordedYesterday = uniqueDates.some(d => isSameDay(d, checkDate));
        if (!recordedYesterday) {
          setStreak(0);
          return;
        }
      }

      // Count backwards
      for (let i = 0; i < uniqueDates.length; i++) {
        if (isSameDay(uniqueDates[i], checkDate)) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }

      setStreak(currentStreak);
    } catch (err) {
      console.error('Error fetching streak', err);
    }
  };

  const handleSave = (entry: { content: string; mood: string; score: number; insight: string }) => {
    setLastEntry({ mood: entry.mood, insight: entry.insight });
    fetchStreak(); // Refresh streak after saving
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Good Day, {user?.displayName?.split(' ')[0] || 'Friend'}!</h1>
          <p className="opacity-60">How are you feeling today?</p>
        </div>
        {streak >= 3 && (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 font-medium text-sm">
            <Sparkles size={16} />
            <span>{streak} Day Streak!</span>
          </div>
        )}
      </header>

      {quote && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="p-6 card rounded-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Quote size={60} />
          </div>
          <p className="text-lg font-medium italic mb-2 relative z-10">"{quote.quote}"</p>
          <p className="text-sm font-bold accent-text">— {quote.author}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VoiceRecorder onSave={handleSave} />
        
        <div className="space-y-6">
          <div className="p-6 card rounded-3xl h-full flex flex-col justify-center">
            {lastEntry ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3 text-emerald-500">
                  <CheckCircle2 size={24} />
                  <h3 className="text-xl font-bold">Journal Saved</h3>
                </div>
                <div>
                  <p className="text-sm opacity-60 uppercase tracking-wider font-bold">Detected Mood</p>
                  <p className="text-2xl font-bold accent-text">{lastEntry.mood}</p>
                </div>
                <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl italic">
                  <p className="text-sm">"{lastEntry.insight}"</p>
                </div>
              </motion.div>
            ) : (
              <div className="text-center space-y-4 opacity-50">
                <div className="w-16 h-16 rounded-full bg-[var(--card)] border border-[var(--border)] mx-auto flex items-center justify-center">
                  <Sparkles size={32} />
                </div>
                <p className="font-medium">Record your first journal entry to see AI insights here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
