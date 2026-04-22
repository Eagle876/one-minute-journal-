import React, { useState, useEffect } from 'react';
import { Home, BarChart2, Calendar, MessageSquare, Settings, Activity, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Theme } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: Theme;
}

export default function Layout({ children, activeTab, setActiveTab, theme }: LayoutProps) {
  const { user } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleLogout = () => {
    signOut(auth);
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'stats', icon: BarChart2, label: 'Stats' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'activities', icon: Activity, label: 'Activity' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* Top Header */}
      <header className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold accent-text tracking-tight">One Min Journal</h1>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold">{user?.displayName || 'User'}</p>
            <p className="text-[10px] opacity-50">Level 1 Mindful</p>
          </div>
          <div className="w-8 h-8 rounded-full accent-bg flex items-center justify-center text-white font-bold text-xs">
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 pt-4 px-4 md:px-8 overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg)] border-t border-[var(--border)] px-2 pb-safe backdrop-blur-lg bg-opacity-90">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300
                  ${isActive ? 'accent-text' : 'opacity-40 hover:opacity-70'}
                `}
              >
                <div className={`
                  p-1.5 rounded-xl transition-all duration-300
                  ${isActive ? 'bg-[var(--accent)]/10' : ''}
                `}>
                  <item.icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] mt-1 font-bold tracking-wide uppercase ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-[1px] w-8 h-[2px] accent-bg rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
