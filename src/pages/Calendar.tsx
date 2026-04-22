import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../services/firebase';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [journals, setJournals] = useState<any[]>([]);

  useEffect(() => {
    const fetchJournals = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'journals'), 
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate() || new Date()
        })).sort((a: any, b: any) => b.created_at - a.created_at);
        setJournals(data);
      } catch (err) {
        console.error('Error fetching journals', err);
      }
    };

    fetchJournals();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getMoodForDay = (day: Date) => {
    return journals.find(j => isSameDay(new Date(j.created_at), day));
  };

  const moodColors: Record<string, string> = {
    Happy: 'bg-emerald-400',
    Sad: 'bg-blue-400',
    Anxious: 'bg-amber-400',
    Calm: 'bg-indigo-400',
    Excited: 'bg-pink-400',
    Neutral: 'bg-slate-400',
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mood Calendar</h1>
          <p className="opacity-60">Track your daily emotional landscape.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-black/5 rounded-full">
            <ChevronLeft />
          </button>
          <h2 className="text-xl font-bold min-w-[150px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-black/5 rounded-full">
            <ChevronRight />
          </button>
        </div>
      </header>

      <div className="card rounded-3xl overflow-hidden shadow-xl">
        <div className="grid grid-cols-7 bg-black/5 border-b border-[var(--border)]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-4 text-center text-xs font-bold uppercase tracking-wider opacity-50">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const journal = getMoodForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className={`
                  min-h-[100px] p-2 border-r border-b border-[var(--border)] transition-colors
                  ${!isCurrentMonth ? 'opacity-20 bg-black/[0.02]' : ''}
                  ${isToday ? 'bg-indigo-500/5' : ''}
                `}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-medium ${isToday ? 'accent-text font-bold' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {journal && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-sm"
                      title={journal.mood}
                    >
                      {journal.emoji || <div className={`w-3 h-3 rounded-full ${moodColors[journal.mood] || 'bg-slate-400'}`} />}
                    </motion.div>
                  )}
                </div>
                {journal && (
                  <div className="mt-2">
                    <p className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                      <span>{journal.emoji}</span>
                      <span>{journal.mood}</span>
                    </p>
                    <p className="text-[10px] line-clamp-2 opacity-70">{journal.content}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center p-4 card rounded-2xl">
        {Object.entries(moodColors).map(([mood, color]) => (
          <div key={mood} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs font-medium">{mood}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
