'use client';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import CarbonGauge from '@/components/CarbonGauge';
import TrendChart from '@/components/TrendChart';
import { BENCHMARKS } from '@/lib/emissionFactors';

const EQUIVALENTS = [
  { icon: '🌳', label: 'Trees to offset 1 year', calc: (kg: number) => (kg * 365 / 21).toFixed(1) },
  { icon: '🚗', label: 'km in a petrol car',     calc: (kg: number) => Math.round(kg / 0.21).toLocaleString() },
  { icon: '💡', label: 'Hours of LED lighting',  calc: (kg: number) => Math.round(kg / 0.015).toLocaleString() },
];

const QUICK_CATS = [
  { href: '/tracker?cat=transport', icon: '🚗', label: 'Transport', bg: 'hsla(214,80%,30%,0.4)', border: 'hsla(214,80%,55%,0.3)', color: 'hsl(214,90%,68%)' },
  { href: '/tracker?cat=food',      icon: '🍽️', label: 'Food',      bg: 'hsla(152,55%,20%,0.4)', border: 'hsla(152,55%,50%,0.3)', color: 'hsl(152,68%,62%)' },
  { href: '/tracker?cat=energy',    icon: '⚡',  label: 'Energy',   bg: 'hsla(38,90%,26%,0.4)',  border: 'hsla(38,90%,55%,0.3)',  color: 'hsl(40,96%,65%)' },
  { href: '/tracker?cat=shopping',  icon: '🛍️', label: 'Shopping', bg: 'hsla(270,60%,26%,0.4)', border: 'hsla(270,60%,55%,0.3)', color: 'hsl(270,70%,70%)' },
];

const CAT_CONFIG = [
  { key: 'transport', label: 'Transport', icon: '🚗', color: 'hsl(214,90%,66%)' },
  { key: 'food',      label: 'Food',      icon: '🍽️', color: 'hsl(152,68%,62%)' },
  { key: 'energy',    label: 'Energy',    icon: '⚡',  color: 'hsl(40,96%,65%)' },
  { key: 'shopping',  label: 'Shopping',  icon: '🛍️', color: 'hsl(270,70%,70%)' },
  { key: 'offset',    label: 'Offsets',   icon: '♻️', color: 'hsl(174,70%,52%)' },
];

export default function DashboardPage() {
  const { todayEmission, weeklyEmissions, activities, streak, getDailyLogs } = useApp();
  const weekLogs   = getDailyLogs(7);
  const todayActs  = getDailyLogs(1)[0]?.activities ?? [];

  const weekTotal = weeklyEmissions.reduce((s, v) => s + v, 0);
  const weekAvg   = weekTotal / 7;
  const vsIndia   = (todayEmission - BENCHMARKS.india_daily) / BENCHMARKS.india_daily * 100;
  const vsGlobal  = (todayEmission - BENCHMARKS.global_daily) / BENCHMARKS.global_daily * 100;

  const catTotals = todayActs.reduce<Record<string,number>>((a, act) => {
    a[act.category] = (a[act.category] || 0) + act.emission;
    return a;
  }, {});

  const maxCat = Math.max(...Object.values(catTotals), 0.1);

  return (
    <div className="page">
      <div className="container">

        {/* ── HERO ── */}
        <div className="page-hero animate-in">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
            <span className="badge badge-green">🌿 Live Dashboard</span>
            {streak > 0 && <span className="badge badge-amber">🔥 {streak}-day streak</span>}
            <span className="badge badge-teal">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <h1>Your Carbon <span className="gradient-text">Footprint</span></h1>
          <p style={{ marginTop: '0.75rem', maxWidth: '520px', fontSize: '1.05rem' }}>
            Track daily emissions, understand your impact, and take action toward a greener lifestyle.
          </p>
        </div>

        {/* ── TOP ROW: Gauge + Stats + Trend ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Gauge card */}
          <div className="card-glass animate-in delay-1" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '1.25rem', padding: '2rem 1.5rem',
          }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Today&apos;s Total
            </p>
            <CarbonGauge value={todayEmission} max={20} target={BENCHMARKS.india_daily} size={200} />

            {/* Benchmarks */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'vs India avg', val: vsIndia },
                { label: 'vs Global avg', val: vsGlobal },
              ].map(b => (
                <div key={b.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.6rem 0.875rem',
                  background: 'var(--bg-card-2)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{b.label}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem',
                    color: b.val < 0 ? 'var(--green-300)' : b.val < 20 ? 'var(--amber-400)' : 'var(--red-400)',
                  }}>
                    {b.val > 0 ? '+' : ''}{b.val.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {[
                {
                  icon: '📅', label: 'Week Total',
                  val: weekTotal.toFixed(1), unit: 'kg CO₂e',
                  color: weekTotal < BENCHMARKS.india_daily * 7 ? 'var(--green-300)' : 'var(--amber-400)',
                },
                {
                  icon: '📊', label: 'Daily Avg',
                  val: weekAvg.toFixed(2), unit: 'kg/day',
                  color: weekAvg < BENCHMARKS.india_daily ? 'var(--green-300)' : 'var(--amber-400)',
                },
                {
                  icon: '📈', label: 'Annual Pace',
                  val: (weekAvg * 365 / 1000).toFixed(2), unit: 'tonnes/yr',
                  color: weekAvg * 365 < BENCHMARKS.paris_target_annual ? 'var(--green-300)' : 'var(--red-400)',
                },
              ].map((kpi, i) => (
                <div key={i} className={`card animate-in delay-${i + 2}`} style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{kpi.icon}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                      {kpi.label}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.04em', color: kpi.color, lineHeight: 1 }}>
                    {kpi.val}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{kpi.unit}</p>
                </div>
              ))}
            </div>

            {/* Trend chart */}
            <div className="card animate-in delay-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.2rem' }}>7-Day Trend</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Dashed line = India average ({BENCHMARKS.india_daily} kg/day)
                  </p>
                </div>
                <Link href="/insights" style={{ fontSize: '0.8rem', color: 'var(--green-300)', textDecoration: 'none', fontWeight: 600 }}>
                  Full analysis →
                </Link>
              </div>
              <TrendChart data={weeklyEmissions} target={BENCHMARKS.india_daily} height={170} />
            </div>
          </div>
        </div>

        {/* ── MIDDLE ROW: Category + Quick Log + Impact ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

          {/* Category breakdown */}
          <div className="card animate-in delay-2">
            <div className="section-title">
              <h3>Category Breakdown</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Today</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {CAT_CONFIG.map(cat => {
                const val = catTotals[cat.key] ?? 0;
                const pct = todayEmission > 0 ? (val / todayEmission) * 100 : 0;
                return (
                  <div key={cat.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                        {cat.label}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: val > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {val.toFixed(2)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>kg</span>
                      </span>
                    </div>
                    <div className="progress-track">
                      <div style={{
                        height: '100%', borderRadius: '999px',
                        background: `linear-gradient(90deg, ${cat.color}cc, ${cat.color})`,
                        width: `${pct}%`,
                        transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Log */}
          <div className="card animate-in delay-3">
            <h3 style={{ marginBottom: '1rem' }}>Quick Log</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {QUICK_CATS.map(cat => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  id={`quick-${cat.label.toLowerCase()}`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '0.5rem', padding: '1.1rem 0.5rem',
                    background: cat.bg,
                    border: `1px solid ${cat.border}`,
                    borderRadius: '14px',
                    textDecoration: 'none',
                    transition: 'all 220ms ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.03)';
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${cat.border}`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = '';
                    (e.currentTarget as HTMLElement).style.boxShadow = '';
                  }}
                >
                  <span style={{ fontSize: '1.75rem' }}>{cat.icon}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: cat.color, letterSpacing: '0.02em' }}>
                    {cat.label}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/tracker"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: '0.875rem', padding: '0.65rem',
                background: 'linear-gradient(135deg, var(--green-400), var(--teal-400))',
                color: 'hsl(222,28%,6%)', borderRadius: '12px',
                fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
                boxShadow: '0 0 20px var(--glow-green)',
                transition: 'all 200ms ease',
              }}
            >
              + Log Activity
            </Link>
          </div>

          {/* Real-world impact */}
          <div className="card-glow animate-in delay-4">
            <h3 style={{ marginBottom: '1.25rem' }}>🌍 Real Impact</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Your today&apos;s {todayEmission.toFixed(1)} kg CO₂e is equivalent to…
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {EQUIVALENTS.map(eq => (
                <div key={eq.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{
                    width: '46px', height: '46px', background: 'hsla(152,52%,20%,0.5)',
                    border: '1px solid hsla(152,52%,40%,0.3)', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', flexShrink: 0,
                  }}>{eq.icon}</span>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-300)', lineHeight: 1 }}>
                      {eq.calc(todayEmission)}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{eq.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW: Recent + CTA ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* Recent activity */}
          <div className="card animate-in delay-3">
            <div className="section-title">
              <h3>Recent Activity</h3>
              <Link href="/tracker" style={{ fontSize: '0.8rem', color: 'var(--green-300)', fontWeight: 600, textDecoration: 'none' }}>
                View all →
              </Link>
            </div>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📝</p>
                <p style={{ fontWeight: 500, marginBottom: '1rem' }}>No activities yet</p>
                <Link href="/tracker" style={{
                  display: 'inline-flex', padding: '0.55rem 1.25rem',
                  background: 'linear-gradient(135deg, var(--green-400), var(--teal-400))',
                  color: 'hsl(222,28%,6%)', borderRadius: '10px',
                  fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
                }}>
                  Log your first activity
                </Link>
              </div>
            ) : (
              <div>
                {activities.slice(0, 5).map((act, i) => (
                  <div key={act.id} className="metric-row" style={{ animationDelay: `${i * 60}ms` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'var(--bg-card-3)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
                      }}>
                        {act.category === 'transport' ? '🚗' : act.category === 'food' ? '🍽️' : act.category === 'energy' ? '⚡' : act.category === 'offset' ? '♻️' : '🛍️'}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{act.label}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{act.date} · {act.quantity} {act.unit}</p>
                      </div>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap',
                      color: act.emission < 0 ? 'var(--green-300)' : 'var(--text-primary)',
                    }}>
                      {act.emission < 0 ? '−' : '+'}{Math.abs(act.emission)} kg
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA Card */}
          <div className="card-glow animate-in delay-4" style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            background: 'linear-gradient(145deg, hsla(152,50%,11%,0.8) 0%, hsla(174,50%,10%,0.6) 100%)',
            padding: '2.5rem',
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🌱</span>
            <h2 style={{ marginBottom: '0.75rem', fontSize: '1.6rem' }}>
              Ready to<br /><span className="gradient-text">reduce your impact?</span>
            </h2>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.7 }}>
              Get AI-powered insights on your highest-impact activities and set achievable reduction goals.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link href="/insights" id="cta-insights" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.875rem 1.5rem',
                background: 'linear-gradient(135deg, var(--green-400), var(--teal-400))',
                color: 'hsl(222,28%,6%)', borderRadius: '14px',
                fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
                boxShadow: '0 0 28px var(--glow-green)',
                transition: 'all 200ms ease',
              }}>
                🤖 Get AI Insights
              </Link>
              <Link href="/goals" id="cta-goals" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.875rem 1.5rem',
                background: 'hsla(152,50%,18%,0.5)',
                border: '1px solid hsla(152,50%,40%,0.35)',
                color: 'var(--green-300)', borderRadius: '14px',
                fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none',
                transition: 'all 200ms ease',
              }}>
                🎯 Set a Goal
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
