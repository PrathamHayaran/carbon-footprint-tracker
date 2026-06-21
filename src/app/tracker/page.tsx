'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { EMISSION_FACTORS } from '@/lib/emissionFactors';
import { CATEGORY_CONFIG, CategoryKey } from '@/lib/constants';
import { useActivityForm } from '@/hooks/useActivityForm';

function TrackerContent() {
  const searchParams = useSearchParams();
  const initialCat = (searchParams.get('cat') as CategoryKey) || 'transport';
  const { activities, deleteActivity, getDailyLogs } = useApp();

  const form = useActivityForm(initialCat);

  const catFactors = EMISSION_FACTORS[form.activeCategory] as Record<
    string,
    { factor: number; unit: string; label: string }
  >;
  const activityKeys = Object.keys(catFactors);

  const todayLogs = getDailyLogs(1)[0]?.activities ?? [];
  const recentActivities = activities.slice(0, 20);

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
              {CATEGORY_CONFIG.map(cat => (
                <button
                  key={cat.key}
                  id={`tab-${cat.key}`}
                  className={`tab ${form.activeCategory === cat.key ? 'active' : ''}`}
                  onClick={() => form.setActiveCategory(cat.key)}
                  style={{ flex: 'unset', padding: '0.5rem 0.75rem' }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={form.handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Activity Type */}
              <div>
                <label className="label" htmlFor="activity-type">Activity Type</label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="activity-type"
                    className="select"
                    value={form.activityType}
                    onChange={e => form.setActivityType(e.target.value)}
                  >
                    {activityKeys.map(key => (
                      <option key={key} value={key}>{catFactors[key]?.label}</option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>▾</span>
                </div>
              </div>

              {/* Quantity + Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label" htmlFor="quantity">
                    Quantity ({form.activityType ? (catFactors[form.activityType]?.unit ?? '—') : '—'})
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="0"
                    step="any"
                    className="input"
                    placeholder={`Enter ${form.activityType ? (catFactors[form.activityType]?.unit ?? 'amount') : 'amount'}`}
                    value={form.quantity}
                    onChange={e => form.setQuantity(e.target.value)}
                    required
                    aria-describedby={form.validationError ? 'form-error' : undefined}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="log-date">Date</label>
                  <input
                    id="log-date"
                    type="date"
                    className="input"
                    value={form.date}
                    onChange={e => form.setDate(e.target.value)}
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
                  value={form.note}
                  onChange={e => form.setNote(e.target.value)}
                />
              </div>

              {/* Validation error */}
              {form.validationError && (
                <p id="form-error" role="alert" style={{ color: 'var(--red-400)', fontSize: '0.85rem' }}>
                  ⚠️ {form.validationError}
                </p>
              )}

              {/* Emission preview */}
              {form.preview !== 0 && (
                <div style={{
                  background: 'var(--bg-card-2)',
                  border: `1px solid ${form.previewColor}40`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  <div>
                    <p className="text-xs text-muted">Carbon Emission Preview</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', fontWeight: 700, color: form.previewColor, lineHeight: 1, marginTop: '0.25rem' }}>
                      {form.preview < 0 ? '−' : '+'}{Math.abs(form.preview).toFixed(2)} kg CO₂e
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="text-xs text-muted">Equivalent to</p>
                    <p className="text-sm" style={{ marginTop: '0.2rem', fontWeight: 500 }}>
                      {Math.abs(form.preview / 0.21).toFixed(0)} km petrol drive
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
                {activityKeys.map(key => {
                  const f = catFactors[key];
                  if (!f) return null;
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                      <span className="mono" style={{ color: 'var(--green-300)', fontWeight: 600 }}>
                        {f.factor > 0 ? '' : '−'}{Math.abs(f.factor)} kg/{f.unit}
                      </span>
                    </div>
                  );
                })}
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
                          title="Delete activity"
                          aria-label={`Delete ${act.label}`}
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
      {form.toast && (
        <div className="toast" id="activity-toast" role="status" aria-live="polite">
          <span style={{ fontSize: '1.25rem' }}>🌱</span>
          <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{form.toast}</p>
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
