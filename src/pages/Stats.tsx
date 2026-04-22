import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Activity, Heart, Sparkles, ArrowLeft, Calendar as CalendarIcon, MessageSquare, Info, X, Trash2 } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, getDocs, orderBy, where, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { isSameDay, subDays, format } from 'date-fns';

export default function Stats() {
  const { user } = useAuth();
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [view, setView] = useState<'dashboard' | 'all-journals'>('dashboard');
  const [selectedJournal, setSelectedJournal] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'journals'), 
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a: any, b: any) => {
          const dateA = a.created_at?.toDate?.() || 0;
          const dateB = b.created_at?.toDate?.() || 0;
          return dateB - dateA;
        });
        setJournals(data);
        calculateStreak(data);
      } catch (err) {
        console.error('Error fetching stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const calculateStreak = (data: any[]) => {
    const dates = data
      .map(j => j.created_at?.toDate?.())
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime());

    if (dates.length === 0) {
      setStreak(0);
      return;
    }

    const uniqueDates: Date[] = [];
    dates.forEach(date => {
      if (!uniqueDates.some(d => isSameDay(d, date))) {
        uniqueDates.push(date);
      }
    });

    let currentStreak = 0;
    let checkDate = new Date();
    const recordedToday = uniqueDates.some(d => isSameDay(d, checkDate));
    
    if (!recordedToday) {
      checkDate = subDays(checkDate, 1);
      const recordedYesterday = uniqueDates.some(d => isSameDay(d, checkDate));
      if (!recordedYesterday) {
        setStreak(0);
        return;
      }
    }

    for (let i = 0; i < uniqueDates.length; i++) {
      if (isSameDay(uniqueDates[i], checkDate)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
    setStreak(currentStreak);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId === id) {
      try {
        await deleteDoc(doc(db, 'journals', id));
        const updatedJournals = journals.filter(j => j.id !== id);
        setJournals(updatedJournals);
        calculateStreak(updatedJournals);
        setDeletingId(null);
      } catch (err) {
        console.error('Error deleting journal', err);
      }
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const getSentimentEmoji = (score: number) => {
    if (score > 0.6) return '🤩';
    if (score > 0.2) return '😊';
    if (score > -0.2) return '😐';
    if (score > -0.6) return '😔';
    return '😢';
  };

  const avgSentiment = journals.length > 0 
    ? journals.reduce((a, b) => a + (b.sentiment_score || 0), 0) / journals.length
    : 0;

  const moodCounts = journals.reduce((acc: any, curr: any) => {
    acc[curr.mood] = (acc[curr.mood] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(moodCounts).map(mood => ({
    name: mood,
    value: moodCounts[mood]
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) return <div className="p-8 text-center">Loading stats...</div>;

  if (view === 'all-journals') {
    return (
      <div className="space-y-6">
        <header className="flex items-center space-x-4">
          <button 
            onClick={() => setView('dashboard')}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">All Journals</h1>
            <p className="opacity-60">Your complete history of reflections.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {journals.map((journal) => (
            <motion.div
              layoutId={journal.id}
              key={journal.id}
              onClick={() => setSelectedJournal(journal)}
              className="p-6 card rounded-3xl cursor-pointer hover:border-[var(--accent)]/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-2xl">{journal.emoji}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleDelete(e, journal.id)}
                    className={`p-2 rounded-xl transition-all ${
                      deletingId === journal.id 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-black/5 hover:bg-rose-500/10 hover:text-rose-500'
                    }`}
                    title={deletingId === journal.id ? "Confirm Delete" : "Delete Entry"}
                  >
                    <Trash2 size={14} />
                  </button>
                  <span className="text-xs opacity-40 font-mono">
                    {journal.created_at?.toDate ? format(journal.created_at.toDate(), 'MMM dd, yyyy') : 'Recently'}
                  </span>
                </div>
              </div>
              <h4 className="font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">{journal.mood}</h4>
              <p className="text-sm opacity-70 line-clamp-3 italic mb-4">"{journal.content}"</p>
              <div className="flex items-center justify-between pt-4 border-t border-black/5">
                <span className="text-[10px] font-bold uppercase opacity-40">Sentiment Score</span>
                <span className="text-xs font-bold">{journal.sentiment_score?.toFixed(2)}</span>
              </div>
            </motion.div>
          ))}
        </div>

                <AnimatePresence>
          {selectedJournal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--accent)]/10">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{selectedJournal.emoji}</span>
                    <div>
                      <h3 className="text-xl font-bold">{selectedJournal.mood}</h3>
                      <p className="text-xs opacity-50">
                        {selectedJournal.created_at?.toDate ? format(selectedJournal.created_at.toDate(), 'MMMM dd, yyyy • HH:mm') : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedJournal(null)}
                    className="p-2 rounded-full hover:bg-black/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-8 overflow-y-auto space-y-8">
                  <section>
                    <div className="flex items-center space-x-2 mb-4 opacity-40">
                      <MessageSquare size={16} />
                      <h4 className="text-xs font-bold uppercase tracking-widest">Transcription</h4>
                    </div>
                    <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-3xl italic text-lg leading-relaxed">
                      "{selectedJournal.content}"
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center space-x-2 mb-4 opacity-40">
                      <Info size={16} />
                      <h4 className="text-xs font-bold uppercase tracking-widest">AI Insight</h4>
                    </div>
                    <div className="p-6 border border-[var(--accent)]/20 bg-[var(--accent)]/5 rounded-3xl text-sm leading-relaxed">
                      {selectedJournal.insight}
                    </div>
                  </section>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
                      <p className="text-[10px] font-bold uppercase opacity-40 mb-1">Sentiment Score</p>
                      <p className="text-xl font-bold accent-text">{selectedJournal.sentiment_score?.toFixed(3)}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
                      <p className="text-[10px] font-bold uppercase opacity-40 mb-1">Mood Category</p>
                      <p className="text-xl font-bold">{selectedJournal.mood}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-[var(--border)] bg-[var(--card)]">
                  <button 
                    onClick={() => setSelectedJournal(null)}
                    className="w-full py-4 rounded-2xl bg-[var(--accent)] text-white font-bold hover:opacity-90 transition-opacity"
                  >
                    Close Entry
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const displayedJournals = journals.slice(0, 3);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Progress</h1>
          <p className="opacity-60">Visualizing your mental health journey with Firebase.</p>
        </div>
        {streak >= 3 && (
          <div className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
            <Sparkles size={20} />
            <span>{streak} Day Streak!</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          onClick={() => setView('all-journals')}
          className="p-6 card rounded-3xl flex items-center space-x-4 hover:border-[var(--accent)]/50 transition-all text-left group"
        >
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm opacity-60">Total Journals</p>
            <p className="text-2xl font-bold">{journals.length}</p>
          </div>
        </button>
        <div className="p-6 card rounded-3xl flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm opacity-60">Avg. Sentiment</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">{avgSentiment.toFixed(2)}</p>
              <span className="text-2xl">{getSentimentEmoji(avgSentiment)}</span>
            </div>
          </div>
        </div>
        <div className="p-6 card rounded-3xl flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
            <Heart size={24} />
          </div>
          <div>
            <p className="text-sm opacity-60">Moods Tracked</p>
            <p className="text-2xl font-bold">{Object.keys(moodCounts).length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 card rounded-3xl min-h-[400px]">
          <h3 className="text-xl font-bold mb-6">Mood Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 card rounded-3xl min-h-[400px]">
          <h3 className="text-xl font-bold mb-6">Mood Frequency</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pieData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="p-8 card rounded-3xl">
        <h3 className="text-xl font-bold mb-6">Recent Journals</h3>
        <div className="space-y-4">
          {displayedJournals.length > 0 ? (
            displayedJournals.map((journal) => (
              <div key={journal.id} className="p-4 bg-[var(--bg)] rounded-2xl border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                      journal.mood === 'Happy' ? 'bg-emerald-500/20 text-emerald-600' :
                      journal.mood === 'Sad' ? 'bg-blue-500/20 text-blue-600' :
                      journal.mood === 'Anxious' ? 'bg-amber-500/20 text-amber-600' :
                      'bg-slate-500/20 text-slate-600'
                    }`}>
                      <span>{journal.emoji}</span>
                      <span>{journal.mood}</span>
                    </span>
                    <span className="text-xs opacity-40">
                      {journal.created_at?.toDate ? journal.created_at.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                  <div className="text-xs font-bold accent-text">
                    Score: {journal.sentiment_score?.toFixed(2)}
                  </div>
                </div>
                <p className="text-sm line-clamp-2 italic opacity-80 mb-2">"{journal.content}"</p>
                <p className="text-xs opacity-60 border-t border-[var(--border)] pt-2 mt-2">
                  <span className="font-bold">Insight:</span> {journal.insight}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center opacity-40 py-8">No journals recorded yet.</p>
          )}
        </div>
        
        {journals.length > 3 && (
          <button 
            onClick={() => setView('all-journals')}
            className="w-full mt-6 py-3 rounded-xl border border-[var(--border)] text-sm font-bold hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 transition-all"
          >
            Show All Journals
          </button>
        )}
      </div>
    </div>
  );
}
