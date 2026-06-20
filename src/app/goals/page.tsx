'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { BENCHMARKS } from '@/lib/emissionFactors';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetKg: number;
  type: 'daily' | 'weekly' | 'monthly';
  category?: string;
  createdAt: number;
}

const CHALLENGES = [
  {
    id: 'meat-free',
    icon: '🥗',
    title: 'Meat-Free Mondays',
    description: 'Skip meat every Monday for 4 weeks. Reduces food emissions by ~15%.',
    duration: '4 weeks',
    savingKg: 45,
    difficulty: 'easy' as const,
    tips: ['Try lentil dal or chickpea curry', 'Plan meals the night before', 'Stock plant-based proteins'],
  },
  {
    id: 'commute-green',
    icon: '🚌',
    title: 'Green Commute Week',
    description: 'Use public transport, cycle, or walk every day for 5 days.',
    duration: '5 days',
    savingKg: 25,
    difficulty: 'medium' as const,
    tips: ['Download transit app', 'Try cycling on short trips', 'Combine trips efficiently'],
  },
  {
    id: 'energy-audit',
    icon: '⚡',
    title: '30-Day Energy Saver',
    description: 'Reduce home energy use by 20%. Switch to LEDs, unplug devices, optimize AC.',
    duration: '30 days',
    savingKg: 60,
    difficulty: 'medium' as const,
    tips: ['Set AC to 26°C', 'Unplug chargers when not in use', 'Use cold water for laundry'],
  },
  {
    id: 'zero-waste',
    icon: '♻️',
    title: 'Zero Waste Shopping',
    description: 'Buy nothing new for 2 weeks. Use what you have, borrow, or buy second-hand.',
    duration: '2 weeks',
    savingKg: 30,
    difficulty: 'hard' as const,
    tips: ['Audit your wardrobe first', 'Use library or borrow services', 'Repair instead of replace'],
  },
  {
    id: 'plant-trees',
    icon: '🌳',
    title: 'Tree Planting Sprint',
    description: 'Plant or sponsor 5 trees this month to offset your footprint.',
    duration: '1 month',
    savingKg: 105,
    difficulty: 'easy' as const,
    tips: ['Partner with local NGOs', 'Try Sankalptaru or Tree-Nation', 'Document your plantings'],
  },
  {
    id: 'local-food',
    icon: '🌾',
    title: 'Eat Local for a Week',
    description: 'Source 80% of your food locally. Reduces transport emissions in food supply chain.',
    duration: '7 days',
    savingKg: 15,
    difficulty: 'medium' as const,
    tips: ['Visit local markets', 'Join a CSA (farm box)', 'Grow herbs at home'],
  },
];

const BADGES = [
  { id: 'first-log',    icon: '🌱', title: 'First Step',     description: 'Logged your first activity', earned: true },
  { id: 'streak-3',    icon: '🔥', title: '3-Day Streak',   description: 'Below average 3 days in a row', earned: false },
  { id: 'streak-7',    icon: '⭐', title: 'Week Warrior',   description: 'Below average 7 days in a row', earned: false },
  { id: 'reducer-10',  icon: '📉', title: 'First Reducer',  description: 'Reduced emissions by 10% in a week', earned: false },
  { id: 'offset-pro',  icon: '🌳', title: 'Offset Pro',     description: 'Logged 5+ offset activities', earned: false },
  { id: 'goal-setter', icon: '🎯', title: 'Goal Setter',    description: 'Set your first reduction goal', earned: false },
];

const difficultyColor = {
  easy:   { color: 'var(--green-300)', bg: 'hsla(150,60%,30%,0.25)', border: 'hsla(150,60%,40%,0.35)' },
  medium: { color: 'var(--amber-400)', bg: 'hsla(38,92%,40%,0.2)',   border: 'hsla(38,92%,40%,0.35)' },
  hard:   { color: 'var(--red-400)',   bg: 'hsla(0,72%,40%,0.2)',    border: 'hsla(0,72%,40%,0.35)' },
};

export default function GoalsPage() {
  const { getDailyLogs, todayEmission } = useApp();
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Stay below India average',
      description: 'Keep daily emissions under 5.2 kg CO₂e',
      targetKg: BENCHMARKS.india_daily,
      type: 'daily',
      createdAt: Date.now(),
    }
  ]);
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState<{ title: string; targetKg: string; type: 'daily' | 'weekly' | 'monthly' }>({ title: '', targetKg: '', type: 'daily' });
  const [toast, setToast] = useState<string | null>(null);

  const weekLogs = getDailyLogs(7);
  const weekAvg = weekLogs.reduce((s, l) => s + l.totalEmission, 0) / 7;

  const getProgress = (goal: Goal) => {
    if (goal.type === 'daily') {
      return Math.min((todayEmission / goal.targetKg) * 100, 100);
    }
    const total = weekLogs.reduce((s, l) => s + l.totalEmission, 0);
    return Math.min((total / (goal.targetKg * 7)) * 100, 100);
  };

  const addGoal = () => {
    if (!newGoal.title || !newGoal.targetKg) return;
    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: `Target: ${newGoal.targetKg} kg CO₂e per ${newGoal.type}`,
      targetKg: Number(newGoal.targetKg),
      type: newGoal.type,
      createdAt: Date.now(),
    };
    setGoals(prev => [...prev, goal]);
    setNewGoal({ title: '', targetKg: '', type: 'daily' });
    setShowGoalForm(false);
    setToast('🎯 New goal created!');
    setTimeout(() => setToast(null), 3000);
  };

  const joinChallenge = (id: string) => {
    setActiveChallenge(id);
    setToast('🚀 Challenge started! Good luck!');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="page">
      <div className="container">

        <div className="page-hero animate-fadeInUp">
          <span className="badge badge-amber" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>🎯 Goals & Challenges</span>
          <h1>Set Goals, <span className="gradient-text">Take Action</span></h1>
          <p style={{ marginTop: '0.5rem', fontSize: '1.05rem' }}>
            Set personalized reduction targets and join challenges to build sustainable habits.
          </p>
        </div>

        {/* Progress summary */}
        <div className="grid-3 animate-fadeInUp delay-100" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Today vs Daily Goal', current: todayEmission, target: BENCHMARKS.india_daily, unit: 'kg' },
            { label: 'Week Average', current: weekAvg, target: BENCHMARKS.india_daily, unit: 'kg/day' },
            { label: 'Annual Pace', current: Math.round(weekAvg * 365 / 1000 * 10) / 10, target: 2, unit: 'tonnes/yr' },
          ].map(stat => {
            const pct = Math.min((stat.current / stat.target) * 100, 100);
            const good = stat.current <= stat.target;
            return (
              <div key={stat.label} className="card">
                <p className="text-sm text-muted" style={{ marginBottom: '0.625rem' }}>{stat.label}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.4rem', fontWeight: 700, color: good ? 'var(--green-300)' : 'var(--red-400)' }}>
                    {typeof stat.current === 'number' ? stat.current.toFixed(2) : stat.current}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> {stat.unit}</span>
                  </span>
                  <span className="text-xs text-muted">Target: {stat.target} {stat.unit}</span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${!good ? 'progress-fill-red' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: good ? 'var(--green-300)' : 'var(--red-400)', marginTop: '0.4rem', fontWeight: 600 }}>
                  {good ? `✅ ${(100 - pct).toFixed(0)}% below target` : `⚠️ ${(pct - 100).toFixed(0)}% above target`}
                </p>
              </div>
            );
          })}
        </div>

        {/* My Goals */}
        <div className="animate-fadeInUp delay-200" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2>My Goals</h2>
            <button className="btn btn-primary" onClick={() => setShowGoalForm(s => !s)} id="add-goal-btn">
              + Add Goal
            </button>
          </div>

          {showGoalForm && (
            <div className="card" style={{ marginBottom: '1.25rem', animation: 'fadeInUp 0.3s ease', border: '1px solid var(--green-400)40' }}>
              <h4 style={{ marginBottom: '1rem' }}>New Reduction Goal</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label" htmlFor="goal-title">Goal Title</label>
                  <input id="goal-title" className="input" placeholder="e.g. Reduce transport emissions" value={newGoal.title} onChange={e => setNewGoal(g => ({ ...g, title: e.target.value }))} />
                </div>
                <div>
                  <label className="label" htmlFor="goal-target">Target (kg CO₂e)</label>
                  <input id="goal-target" type="number" className="input" placeholder="e.g. 5.2" value={newGoal.targetKg} onChange={e => setNewGoal(g => ({ ...g, targetKg: e.target.value }))} />
                </div>
                <div>
                  <label className="label" htmlFor="goal-type">Period</label>
                  <div style={{ position: 'relative' }}>
                    <select id="goal-type" className="select" value={newGoal.type} onChange={e => setNewGoal(g => ({ ...g, type: e.target.value as 'daily' | 'weekly' | 'monthly' }))}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <span style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>▾</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={addGoal} id="save-goal">Save Goal</button>
                <button className="btn btn-ghost" onClick={() => setShowGoalForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="grid-2">
            {goals.map(goal => {
              const pct = getProgress(goal);
              const good = pct <= 100;
              return (
                <div key={goal.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h4>{goal.title}</h4>
                      <p className="text-sm text-muted">{goal.description}</p>
                    </div>
                    <span className={`badge ${good ? 'badge-green' : 'badge-red'}`}>
                      {good ? '✅ On Track' : '⚠️ Over'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    <span>Progress</span>
                    <span>{pct.toFixed(0)}% of target</span>
                  </div>
                  <div className="progress-track">
                    <div className={`progress-fill ${!good ? 'progress-fill-red' : ''}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: good ? 'var(--green-300)' : 'var(--red-400)', marginTop: '0.4rem', fontWeight: 600 }}>
                    Target: {goal.targetKg} kg · Period: {goal.type}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Challenges */}
        <div className="animate-fadeInUp delay-300" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2>🚀 Challenges</h2>
            <span className="badge badge-blue">Join a 4-week challenge</span>
          </div>
          <div className="grid-3">
            {CHALLENGES.map(ch => {
              const dc = difficultyColor[ch.difficulty];
              const isActive = activeChallenge === ch.id;
              return (
                <div key={ch.id} className="card" style={{ border: isActive ? '1px solid var(--green-400)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>{ch.icon}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: dc.bg, color: dc.color, padding: '0.2rem 0.6rem', borderRadius: '999px', border: `1px solid ${dc.border}`, textTransform: 'capitalize' }}>
                      {ch.difficulty}
                    </span>
                  </div>
                  <h4 style={{ marginBottom: '0.4rem' }}>{ch.title}</h4>
                  <p className="text-sm" style={{ marginBottom: '0.875rem', lineHeight: 1.5 }}>{ch.description}</p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', marginBottom: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>⏱ {ch.duration}</span>
                    <span style={{ color: 'var(--green-300)', fontWeight: 600 }}>💚 ~{ch.savingKg} kg saved</span>
                  </div>
                  <div style={{ marginBottom: '0.875rem' }}>
                    {ch.tips.map((tip, i) => (
                      <p key={i} className="text-xs text-muted" style={{ padding: '0.2rem 0' }}>• {tip}</p>
                    ))}
                  </div>
                  <button
                    className={`btn w-full ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => isActive ? setActiveChallenge(null) : joinChallenge(ch.id)}
                    id={`challenge-${ch.id}`}
                    style={{ justifyContent: 'center' }}
                  >
                    {isActive ? '✓ Active — Leave' : '🚀 Join Challenge'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges */}
        <div className="animate-fadeInUp delay-400">
          <h2 style={{ marginBottom: '1.25rem' }}>🏆 Badges</h2>
          <div className="grid-4">
            {BADGES.map(badge => (
              <div key={badge.id} className="card" style={{ textAlign: 'center', opacity: badge.earned ? 1 : 0.5, filter: badge.earned ? 'none' : 'grayscale(0.5)' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>{badge.icon}</span>
                <h4 style={{ marginBottom: '0.25rem' }}>{badge.title}</h4>
                <p className="text-xs text-muted">{badge.description}</p>
                {badge.earned && <span className="badge badge-green" style={{ marginTop: '0.5rem' }}>Earned ✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast" id="goals-toast">
          <span style={{ fontSize: '1.25rem' }}>🎉</span>
          <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{toast}</p>
        </div>
      )}
    </div>
  );
}
