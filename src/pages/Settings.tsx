import React, { useState, useEffect } from 'react';
import { Moon, Sun, Leaf, Wind, CheckCircle2, Bell, LogOut, User as UserIcon, Save, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Theme } from '../types';
import { auth } from '../services/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

interface SettingsProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export default function Settings({ theme, setTheme }: SettingsProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [notificationTime, setNotificationTime] = useState(() => {
    return localStorage.getItem('notificationTime') || '20:00';
  });

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setNotificationTime(newTime);
    localStorage.setItem('notificationTime', newTime);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !displayName.trim()) return;

    setIsUpdating(true);
    setUpdateSuccess(false);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim()
      });
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="opacity-60">Personalize your One Min Journal experience.</p>
      </header>

      <div className="p-8 card rounded-3xl space-y-6">
        <h3 className="text-xl font-bold">Appearance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`
                p-6 rounded-2xl border-2 transition-all flex items-center justify-between
                ${theme === t.id 
                  ? 'border-[var(--accent)] bg-[var(--accent)]/5' 
                  : 'border-[var(--border)] hover:border-[var(--accent)]/50'}
              `}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${t.color} border border-[var(--border)]`}>
                  <t.icon size={24} className={theme === t.id ? 'accent-text' : ''} />
                </div>
                <span className="font-bold">{t.label}</span>
              </div>
              {theme === t.id && <CheckCircle2 className="accent-text" />}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 card rounded-3xl space-y-6">
        <div className="flex items-center space-x-3">
          <Bell className="accent-text" />
          <h3 className="text-xl font-bold">Daily Reminders</h3>
        </div>
        <div className="flex items-center justify-between p-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
          <div>
            <p className="font-bold">Notification Time</p>
            <p className="text-xs opacity-60">We'll remind you to journal daily.</p>
          </div>
          <input
            type="time"
            value={notificationTime}
            onChange={handleTimeChange}
            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      <div className="p-8 card rounded-3xl space-y-6">
        <div className="flex items-center space-x-3">
          <UserIcon className="accent-text" />
          <h3 className="text-xl font-bold">Account</h3>
        </div>
        <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full accent-bg flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-bold text-xl">{user?.displayName || 'User'}</p>
              <p className="text-sm opacity-60">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4 border-t border-[var(--border)]">
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-bold opacity-60 uppercase tracking-wider">
                Display Name
              </label>
              <div className="flex gap-2">
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={isUpdating || !displayName.trim() || displayName === user?.displayName}
                  className="px-6 py-3 rounded-xl accent-bg text-white font-bold disabled:opacity-50 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  <span>Save</span>
                </button>
              </div>
              {updateSuccess && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-emerald-500 text-xs font-bold flex items-center space-x-1"
                >
                  <CheckCircle2 size={12} />
                  <span>Profile updated successfully!</span>
                </motion.p>
              )}
            </div>
          </form>
          
          <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row gap-4">
            <button disabled className="flex-1 px-6 py-3 rounded-xl bg-[var(--border)] font-bold cursor-not-allowed opacity-50">
              Export Data (Coming Soon)
            </button>
            <button 
              onClick={handleLogout}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-rose-500/50 text-rose-500 font-bold hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center space-x-2"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const themes: { id: Theme; label: string; icon: any; color: string }[] = [
  { id: 'light', label: 'Light Mode', icon: Sun, color: 'bg-white text-slate-900' },
  { id: 'dark', label: 'Dark Mode', icon: Moon, color: 'bg-slate-900 text-white' },
  { id: 'nature', label: 'Nature', icon: Leaf, color: 'bg-[#f0f4f0] text-[#2d3a2d]' },
  { id: 'calm', label: 'Calm', icon: Wind, color: 'bg-[#f5f3ff] text-[#4c1d95]' },
];
