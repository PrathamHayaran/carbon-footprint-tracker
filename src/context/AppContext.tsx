'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Activity, UserProfile, DailyLog } from '@/types';
import { calculateEmission } from '@/lib/emissionFactors';
import { BENCHMARKS } from '@/lib/emissionFactors';

interface AppContextType {
  activities: Activity[];
  todayEmission: number;
  weeklyEmissions: number[];
  monthlyEmissions: number[];
  streak: number;
  profile: UserProfile | null;
  addActivity: (activity: Omit<Activity, 'id' | 'userId' | 'createdAt'>) => void;
  deleteActivity: (id: string) => void;
  getActivityByDate: (date: string) => Activity[];
  getDailyLogs: (days: number) => DailyLog[];
  clearAll: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profile] = useState<UserProfile>({
    uid: 'local-user',
    displayName: 'You',
    email: '',
    country: 'India',
    createdAt: Date.now(),
    goals: [],
    streak: 0,
    lastLogDate: '',
    totalOffset: 0,
  });

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('carbonwise_activities');
      if (stored) setActivities(JSON.parse(stored));
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('carbonwise_activities', JSON.stringify(activities));
  }, [activities]);

  const addActivity = (act: Omit<Activity, 'id' | 'userId' | 'createdAt'>) => {
    const newActivity: Activity = {
      ...act,
      id: generateId(),
      userId: 'local-user',
      createdAt: Date.now(),
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const getActivityByDate = (date: string) =>
    activities.filter(a => a.date === date);

  const getDailyLogs = (days: number): DailyLog[] => {
    const logs: DailyLog[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split('T')[0];
      const dayActivities = getActivityByDate(date);
      const totalEmission = dayActivities.reduce((s, a) => s + a.emission, 0);
      logs.push({ date, totalEmission, activities: dayActivities });
    }
    return logs;
  };

  const todayActivities = getActivityByDate(getToday());
  const todayEmission = Math.round(todayActivities.reduce((s, a) => s + a.emission, 100) * 10) / 10;

  const weeklyLogs = getDailyLogs(7);
  const weeklyEmissions = weeklyLogs.map(l => l.totalEmission);

  const monthlyLogs = getDailyLogs(30);
  const monthlyEmissions = monthlyLogs.map(l => l.totalEmission);

  // Calculate streak
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];
    const dayTotal = getActivityByDate(date).reduce((s, a) => s + a.emission, 0);
    if (i === 0 && dayTotal === 0) break;
    if (dayTotal < BENCHMARKS.india_daily) streak++;
    else break;
  }

  const clearAll = () => {
    setActivities([]);
    localStorage.removeItem('carbonwise_activities');
  };

  return (
    <AppContext.Provider value={{
      activities, todayEmission, weeklyEmissions, monthlyEmissions,
      streak, profile, addActivity, deleteActivity,
      getActivityByDate, getDailyLogs, clearAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}
