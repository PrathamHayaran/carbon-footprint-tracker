'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { EMISSION_FACTORS, calculateEmission } from '@/lib/emissionFactors';
import { Activity } from '@/types';

type Category = 'transport' | 'food' | 'energy' | 'shopping' | 'offset';

const CATEGORIES: { key: Category; label: string; icon: string; color: string }[] = [
  { key: 'transport', label: 'Transport', icon: '🚗', color: 'hsl(212,80%,60%)' },
  { key: 'food',      label: 'Food',      icon: '🍽️', color: 'hsl(150,60%,50%)' },
  { key: 'energy',    label: 'Energy',    icon: '⚡', color: 'hsl(38,92%,58%)' },
  { key: 'shopping',  label: 'Shopping',  icon: '🛍️', color: 'hsl(280,70%,65%)' },
  { key: 'offset',    label: 'Offsets',   icon: '♻️', color: 'hsl(175,72%,45%)' },
];

function TrackerContent() {
  const searchParams = useSearchParams();
  const initialCat = (searchParams.get('cat') as Category) || 'transport';
  const [activeCategory, setActiveCategory] = useState<Category>(initialCat);
  const [activityType, setActivityType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const { addActivity, activities, deleteActivity, getDailyLogs } = useApp();

  const catFactors = EMISSION_FACTORS[activeCategory] as Record<string, { factor: number; unit: string; label: string }>;
  const activityKeys = Object.keys(catFactors);

  useEffect(() => {
    setActivityType(activityKeys[0] || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  useEffect(() => {
    if (activityType && quantity) {
      setPreview(calculateEmission(activeCategory, activityType, Number(quantity)));
    } else {
      setPreview(0);
    }
  }, [activityType, quantity, activeCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityType || !quantity || Number(quantity) <= 0) return;

    const factor = catFactors[activityType];
    const emission = calculateEmission(activeCategory, activityType, Number(quantity));

    addActivity({
      category: activeCategory,
      activityType,
      quantity: Number(quantity),
      unit: factor.unit,
      emission,
      label: factor.label,
      date,
      note,
    });

    setQuantity('');
    setNote('');
    setPreview(0);
    setToast(`✅ Logged ${factor.label} — ${Math.abs(emission).toFixed(2)} kg CO₂e`);
    setTimeout(() => setToast(null), 3500);
  };

  const todayLogs = getDailyLogs(1)[0]?.activities ?? [];
  const recentActivities = activities.slice(0, 20);

  const previewColor = preview < 0
    ? 'var(--green-300)'
    : preview < 2 ? 'var(--green-300)' : preview < 5 ? 'var(--amber-400)' : 'var(--red-400)';

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div className="page-hero animate-fadeInUp">
          <span className="badge badge-teal" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>✏️ Activity Logger</span>
          <h1>Track Your <span className="gradient-text">Activities</span></h1>
          <p style={{ marginTop: '0.5rem', fontSize: '1.05rem' }}>
            Log daily activities to calculate your carbon footprint in real time.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem' }}>

          {/* Form card */}
          <div className="card animate-fadeInUp delay-100" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Log New Activity</h3>

            {/* Category tabs */}
            <div className="tabs" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  id={`tab-${cat.key}`}
                  className={`tab ${activeCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
                  style={{ flex: 'unset', padding: '0.5rem 0.75rem' }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Activity Type */}
              <div>
                <label className="label" htmlFor="activity-type">Activity Type</label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="activity-type"
                    className="select"
                    value={activityType}
                    onChange={e => setActivityType(e.target.value)}
                  >
                    {activityKeys.map(key => (
                      <option key={key} value={key}>{catFactors[key].label}</option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>▾</span>
                </div>
              </div>

              {/* Quantity */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label" htmlFor="quantity">
                    Quantity ({activityType ? catFactors[activityType]?.unit : '—'})
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="0"
                    step="any"
                    className="input"
                    placeholder={`Enter ${activityType ? catFactors[activityType]?.unit : 'amount'}`}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="log-date">Date</label>
                  <input
                    id="log-date"
                    type="date"
                    className="input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="label" htmlFor="activity-note">Note (optional)</label>
                <input
                  id="activity-note"
                  type="text"
                  className="input"
                  placeholder="e.g. Morning commute..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              {/* Preview */}
              {preview !== 0 && (
                <div style={{
                  background: 'var(--bg-card-2)',
                  border: `1px solid ${previewColor}40`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  <div>
                    <p className="text-xs text-muted">Carbon Emission Preview</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', fontWeight: 700, color: previewColor, lineHeight: 1, marginTop: '0.25rem' }}>
                      {preview < 0 ? '−' : '+'}{Math.abs(preview).toFixed(2)} kg CO₂e
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="text-xs text-muted">Equivalent to</p>
                    <p className="text-sm" style={{ marginTop: '0.2rem', fontWeight: 500 }}>
                      {Math.abs(preview / 0.21).toFixed(0)} km petrol drive
                    </p>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-lg w-full" id="submit-activity">
                Log Activity
              </button>
            </form>
          </div>

          {/* Right: Today summary + history */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Today's total */}
            <div className="card-highlight animate-fadeInUp delay-200">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Today&apos;s Total</h4>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '2.5rem', fontWeight: 800, color: 'var(--green-300)', lineHeight: 1, marginTop: '0.25rem' }}>
                    {todayLogs.reduce((s, a) => s + a.emission, 0).toFixed(2)}
                    <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}> kg CO₂e</span>
                  </p>
                </div>
                <span style={{ fontSize: '2.5rem' }}>📅</span>
              </div>
              <p className="text-sm text-muted" style={{ marginTop: '0.75rem' }}>
                {todayLogs.length} activit{todayLogs.length === 1 ? 'y' : 'ies'} logged today
              </p>
            </div>

            {/* Emission factor guide */}
            <div className="card animate-fadeInUp delay-300">
              <h4 style={{ marginBottom: '0.875rem' }}>📚 Emission Factors</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {activityKeys.map(key => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{catFactors[key].label}</span>
                    <span className="mono" style={{ color: 'var(--green-300)', fontWeight: 600 }}>
                      {catFactors[key].factor > 0 ? '' : '−'}{Math.abs(catFactors[key].factor)} kg/{catFactors[key].unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent log */}
            <div className="card animate-fadeInUp delay-400">
              <h4 style={{ marginBottom: '0.875rem' }}>Recent Activities</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxHeight: '280px', overflowY: 'auto' }}>
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-muted" style={{ textAlign: 'center', padding: '1rem 0' }}>No activities yet. Start logging above!</p>
                ) : (
                  recentActivities.map(act => (
                    <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.label}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{act.date} · {act.quantity} {act.unit}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.75rem' }}>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', fontWeight: 700,
                          color: act.emission < 0 ? 'var(--green-300)' : 'var(--text-primary)', whiteSpace: 'nowrap',
                        }}>
                          {act.emission < 0 ? '−' : '+'}{Math.abs(act.emission)} kg
                        </span>
                        <button
                          onClick={() => deleteActivity(act.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem', borderRadius: '4px', lineHeight: 1 }}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="toast" id="activity-toast">
          <span style={{ fontSize: '1.25rem' }}>🌱</span>
          <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{toast}</p>
        </div>
      )}
    </div>
  );
}

export default function TrackerPage() {
  return (
    <Suspense fallback={<div className="page"><div className="container"><div className="skeleton" style={{ height: 400 }} /></div></div>}>
      <TrackerContent />
    </Suspense>
  );
}
