export interface Activity {
  id: string;
  userId: string;
  category: 'transport' | 'food' | 'energy' | 'shopping' | 'offset';
  activityType: string;
  quantity: number;
  unit: string;
  emission: number; // kg CO2e
  label: string;
  date: string; // ISO date string YYYY-MM-DD
  createdAt: number; // timestamp
  note?: string;
}

export interface DailyLog {
  date: string;
  totalEmission: number;
  activities: Activity[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  country: string;
  createdAt: number;
  goals: Goal[];
  streak: number;
  lastLogDate: string;
  totalOffset: number;
}

export interface Goal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'annual';
  targetKg: number;
  startDate: string;
  endDate: string;
  category?: string;
  title: string;
  description?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  targetReduction: number; // kg CO2e
  category: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tips: string[];
}

export interface InsightData {
  generatedAt: number;
  period: 'week' | 'month';
  topEmitters: Array<{ category: string; emission: number; percentage: number }>;
  tips: Array<{ title: string; description: string; savingKg: number; impact: 'low' | 'medium' | 'high' }>;
  totalEmission: number;
  vsIndiaBenchmark: number; // percentage difference
  vsGlobalBenchmark: number;
  weeklyTrend: number[]; // kg per day for last 7 days
  predictedAnnual: number;
}

export interface CategoryBreakdown {
  category: string;
  label: string;
  emission: number;
  percentage: number;
  color: string;
  icon: string;
}
