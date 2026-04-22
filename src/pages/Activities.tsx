import React from 'react';
import { Sparkles, Clock, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export default function Activities() {
  const upcoming = [
    { title: 'Guided Meditation', desc: '10-minute sessions for focus and calm.', icon: Sparkles },
    { title: 'Breathing Exercises', desc: 'Simple techniques to reduce anxiety.', icon: Wind },
    { title: 'Mood Challenges', desc: 'Daily tasks to boost your well-being.', icon: Activity },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Mindful Activities</h1>
        <p className="opacity-60">Coming soon to help you stay balanced.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcoming.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 card rounded-3xl relative overflow-hidden group border-dashed border-2"
          >
            <div className="absolute top-4 right-4 p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
              <Lock size={16} className="opacity-50" />
            </div>
            <div className="p-4 rounded-2xl bg-[var(--accent)]/10 w-fit mb-6">
              <item.icon size={32} className="opacity-30" />
            </div>
            <h3 className="text-xl font-bold mb-2 opacity-50">{item.title}</h3>
            <p className="text-sm opacity-40">{item.desc}</p>
            <div className="mt-6 flex items-center space-x-2 text-xs font-bold uppercase tracking-widest opacity-30">
              <Clock size={14} />
              <span>In Development</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-12 card rounded-3xl text-center border-dashed border-2 flex flex-col items-center justify-center space-y-4 opacity-50">
        <div className="p-6 rounded-full bg-[var(--accent)]/10">
          <Sparkles size={48} />
        </div>
        <h2 className="text-2xl font-bold">More features on the way!</h2>
        <p className="max-w-md mx-auto">We are working on bringing you more tools for your mental health journey. Stay tuned for updates.</p>
      </div>
    </div>
  );
}

import { Wind, Activity } from 'lucide-react';
