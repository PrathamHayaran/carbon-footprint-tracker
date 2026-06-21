'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Activity, UserProfile, DailyLog } from '@/types';
import { BENCHMARKS } from '@/lib/emissionFactors';
import {
  generateId,
  getDateString,
  aggregateDailyLogs,
  calculateStreak,
} from '@/lib/activityUtils';
import { STORAGE_KEYS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      if (stored) {
        const parsed = JSON.parse(stored) as Activity[];
        setActivities(parsed);
      }
    } catch {
      // Corrupt storage — start fresh silently
    }
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const addActivity = (act: Omit<Activity, 'id' | 'userId' | 'createdAt'>): void => {
    const newActivity: Activity = {
      ...act,
      id: generateId(),
      userId: 'local-user',
      createdAt: Date.now(),
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const deleteActivity = (id: string): void => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const clearAll = (): void => {
    setActivities([]);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
  };

  // ---------------------------------------------------------------------------
  // Derived data (computed on each render from activities)
  // ---------------------------------------------------------------------------

  const getActivityByDate = (date: string): Activity[] =>
    activities.filter((a) => a.date === date);

  const getDailyLogs = (days: number): DailyLog[] =>
    aggregateDailyLogs(activities, days);

  const today = getDateString();
  const todayActivities = getActivityByDate(today);
  /**
   * Today's total emission in kg CO₂e.
   * Starts at 0 when no activities have been logged.
   * (Previously had a phantom +100 seed value for demo — corrected to 0.)
   */
  const todayEmission =
    Math.round(todayActivities.reduce((sum, a) => sum + a.emission, 0) * 10) / 10;

  const weeklyLogs = getDailyLogs(7);
  const weeklyEmissions = weeklyLogs.map((l) => l.totalEmission);

  const monthlyLogs = getDailyLogs(30);
  const monthlyEmissions = monthlyLogs.map((l) => l.totalEmission);

  const streak = calculateStreak(activities, BENCHMARKS.india_daily);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <AppContext.Provider
      value={{
        activities,
        todayEmission,
        weeklyEmissions,
        monthlyEmissions,
        streak,
        profile,
        addActivity,
        deleteActivity,
        getActivityByDate,
        getDailyLogs,
        clearAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
