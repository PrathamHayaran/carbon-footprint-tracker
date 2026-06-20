'use client';
import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { BENCHMARKS } from '@/lib/emissionFactors';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import TrendChart from '@/components/TrendChart';

const COLORS = {
  transport: 'hsl(212,80%,60%)',
  food:      'hsl(150,60%,50%)',
  energy:    'hsl(38,92%,58%)',
  shopping:  'hsl(280,70%,65%)',
  offset:    'hsl(175,72%,45%)',
};

const TIPS = [
  {
    category: 'transport',
    title: 'Switch to public transit twice a week',
    description: 'Taking the bus or train instead of driving twice a week can save ~200–400 kg CO₂ per year, depending on your distance.',
    savingKg: 250,
    impact: 'high' as const,
    icon: '🚌',
    effort: 'Medium',
  },
  {
    category: 'food',
    title: 'Try Meat-Free Mondays',
    description: 'Skipping meat just one day per week can reduce your food carbon footprint by up to 15%. Plant-based meals produce 50–90% less CO₂.',
    savingKg: 180,
    impact: 'high' as const,
    icon: '🥗',
    effort: 'Easy',
  },
  {
    category: 'energy',
    title: 'Switch to LED bulbs & unplug idle devices',
    description: 'LED bulbs use 75% less energy. Standby power ("phantom load") can account for 10% of home energy use.',
    savingKg: 90,
    impact: 'medium' as const,
    icon: '💡',
    effort: 'Easy',
  },
  {
    category: 'transport',
    title: 'Combine errands into single trips',
    description: 'Planning routes efficiently and combining multiple stops into one journey can cut transport emissions by 10–20%.',
    savingKg: 120,
    impact: 'medium' as const,
    icon: '🗺️',
    effort: 'Easy',
  },
  {
    category: 'food',
    title: 'Reduce food waste by meal planning',
    description: 'About 30% of food is wasted globally. Each kg of food waste = 2.5 kg CO₂e. Meal planning can cut waste by half.',
    savingKg: 75,
    impact: 'medium' as const,
    icon: '📋',
    effort: 'Easy',
  },
  {
    category: 'energy',
    title: 'Set AC to 24–26°C instead of 20°C',
    description: 'Each degree increase in AC set-point saves 6% energy. Setting 26°C instead of 20°C saves ~36% on cooling costs.',
    savingKg: 110,
    impact: 'medium' as const,
    icon: '❄️',
    effort: 'Easy',
  },
  {
    category: 'shopping',
    title: 'Buy second-hand electronics & clothing',
    description: 'Manufacturing a smartphone emits ~70 kg CO₂. Buying refurbished or second-hand items avoids 80–90% of that.',
    savingKg: 200,
    impact: 'high' as const,
    icon: '♻️',
    effort: 'Medium',
  },
  {
    category: 'offset',
    title: 'Plant trees or support carbon projects',
    description: 'A mature tree absorbs ~21 kg CO₂/year. Planting 10 trees offsets ~210 kg annually. Many verified projects cost <₹500 per tree.',
    savingKg: 210,
    impact: 'high' as const,
    icon: '🌳',
    effort: 'Low',
  },
];

function ImpactBadge({ impact }: { impact: 'low' | 'medium' | 'high' }) {
  const map = {
    low:    { color: 'var(--green-300)',  bg: 'hsla(150,60%,30%,0.25)', label: 'Low Impact' },
    medium: { color: 'var(--amber-400)', bg: 'hsla(38,92%,40%,0.2)',   label: 'Medium Impact' },
    high:   { color: 'var(--red-400)',   bg: 'hsla(0,72%,40%,0.2)',    label: 'High Impact' },
  };
  const s = map[impact];
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color, padding: '0.2rem 0.6rem', borderRadius: '999px', border: `1px solid ${s.color}40` }}>
      {s.label}
    </span>
  );
}

export default function InsightsPage() {
  const { getDailyLogs, weeklyEmissions, monthlyEmissions } = useApp();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);

  const logs = getDailyLogs(period === 'week' ? 7 : 30);
  const totalEmission = logs.reduce((s, l) => s + l.totalEmission, 0);
  const avgDaily = totalEmission / logs.length;
  const predictedAnnual = Math.round(avgDaily * 365);

  const catBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    logs.forEach(l => l.activities.forEach(a => {
      if (a.emission > 0) totals[a.category] = (totals[a.category] || 0) + a.emission;
    }));
    return Object.entries(totals)
      .map(([cat, val]) => ({ name: cat, value: Math.round(val * 100) / 100, color: COLORS[cat as keyof typeof COLORS] || '#888' }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);

  const vsIndia = ((avgDaily - BENCHMARKS.india_daily) / BENCHMARKS.india_daily * 100).toFixed(0);
  const vsGlobal = ((avgDaily - BENCHMARKS.global_daily) / BENCHMARKS.global_daily * 100).toFixed(0);
  const vsParis = ((predictedAnnual - BENCHMARKS.paris_target_annual) / BENCHMARKS.paris_target_annual * 100).toFixed(0);

  const topCat = catBreakdown[0]?.name || 'transport';
  const relevantTips = [...TIPS].sort((a, b) => {
    if (a.category === topCat && b.category !== topCat) return -1;
    if (b.category === topCat && a.category !== topCat) return 1;
    return b.savingKg - a.savingKg;
  });

  const generateAiInsight = async () => {
    setAiLoading(true);
    // Simulated AI insight (in production: calls /api/insights/generate with Vertex AI)
    await new Promise(r => setTimeout(r, 2000));
    const insights = [
      `Based on your ${period}ly data, your biggest opportunity is in **${topCat}**. You're averaging ${avgDaily.toFixed(1)} kg CO₂e/day — ${Math.abs(Number(vsIndia))}% ${Number(vsIndia) > 0 ? 'above' : 'below'} India's average. If you continue at this rate, your annual footprint will be ~${predictedAnnual} kg. **Top action: ${relevantTips[0].title}** — this single change could save you up to ${relevantTips[0].savingKg} kg/year.`,
      `Your data shows strong patterns. ${catBreakdown.length > 0 ? `${catBreakdown[0].name} accounts for ${Math.round(catBreakdown[0].value / totalEmission * 100)}% of your emissions.` : ''} The easiest quick win: **${relevantTips[1]?.title || 'track your transport more carefully'}**. At ${predictedAnnual} kg/year predicted, you're ${Number(vsParis) > 0 ? `${vsParis}% above` : `${Math.abs(Number(vsParis))}% below`} the Paris Agreement 2-tonne target.`,
    ];
    setAiTip(insights[Math.floor(Math.random() * insights.length)]);
    setAiLoading(false);
  };

  return (
    <div className="page">
      <div className="container">

        <div className="page-hero animate-fadeInUp">
          <span className="badge badge-blue" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>🤖 AI-Powered</span>
          <h1>Your Carbon <span className="gradient-text">Insights</span></h1>
          <p style={{ marginTop: '0.5rem', fontSize: '1.05rem' }}>
            Understand your patterns and discover the most impactful ways to reduce your footprint.
          </p>
        </div>

        {/* Period toggle */}
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
          {(['week', 'month'] as const).map(p => (
            <button
              key={p}
              id={`period-${p}`}
              className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'week' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>

        {/* Stats overview */}
        <div className="grid-4 animate-fadeInUp delay-100" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Emission', value: totalEmission.toFixed(1), unit: 'kg CO₂e', icon: '📊', color: 'var(--text-primary)' },
            { label: 'Daily Average', value: avgDaily.toFixed(2), unit: 'kg/day', icon: '📅', color: avgDaily < BENCHMARKS.india_daily ? 'var(--green-300)' : 'var(--amber-400)' },
            { label: 'Predicted Annual', value: (predictedAnnual / 1000).toFixed(2), unit: 'tonnes/yr', icon: '📈', color: predictedAnnual < BENCHMARKS.paris_target_annual ? 'var(--green-300)' : 'var(--red-400)' },
            { label: 'vs Paris Target', value: (Number(vsParis) > 0 ? '+' : '') + vsParis, unit: '%', icon: '🎯', color: Number(vsParis) < 0 ? 'var(--green-300)' : 'var(--red-400)' },
          ].map(stat => (
            <div key={stat.label} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
              </div>
              <p className="stat-number" style={{ color: stat.color, fontSize: '1.8rem' }}>{stat.value}</p>
              <p className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>{stat.unit}</p>
              <p className="text-sm text-secondary" style={{ marginTop: '0.5rem' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid-2 animate-fadeInUp delay-200" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>Emission Trend</h3>
              <span className="badge badge-green">{period === 'week' ? 'Last 7 days' : 'Last 30 days'}</span>
            </div>
            <TrendChart
              data={period === 'week' ? weeklyEmissions : monthlyEmissions}
              type="bar"
              target={BENCHMARKS.india_daily}
              height={220}
            />
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>Category Breakdown</h3>
            </div>
            {catBreakdown.length === 0 ? (
              <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '0.5rem' }}>
                <span style={{ fontSize: '3rem' }}>📊</span>
                <p>No data yet — start logging activities</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={catBreakdown}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {catBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${typeof v === 'number' ? v.toFixed(2) : v} kg CO₂e`, '']}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px' }}
                    labelStyle={{ color: 'var(--text-muted)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend
                    formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'capitalize' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Benchmark comparison */}
        <div className="card animate-fadeInUp delay-300" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>🌏 How You Compare</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { label: 'India Average', daily: BENCHMARKS.india_daily, annual: BENCHMARKS.india_annual, icon: '🇮🇳', diff: vsIndia },
              { label: 'Global Average', daily: BENCHMARKS.global_daily, annual: BENCHMARKS.global_annual, icon: '🌍', diff: vsGlobal },
              { label: 'Paris 2°C Target', daily: (BENCHMARKS.paris_target_annual / 365), annual: BENCHMARKS.paris_target_annual, icon: '🎯', diff: vsParis },
            ].map(bench => (
              <div key={bench.label} style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>{bench.icon}</span>
                <p style={{ fontWeight: 600, marginTop: '0.5rem', marginBottom: '0.25rem' }}>{bench.label}</p>
                <p className="text-sm text-muted">{bench.daily.toFixed(1)} kg/day · {bench.annual} kg/yr</p>
                <p style={{
                  marginTop: '0.75rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '1.3rem', fontWeight: 700,
                  color: Number(bench.diff) < 0 ? 'var(--green-300)' : 'var(--red-400)',
                }}>
                  {Number(bench.diff) > 0 ? '+' : ''}{bench.diff}%
                </p>
                <p className="text-xs text-muted">{Number(bench.diff) < 0 ? '✅ Below' : '⚠️ Above'} benchmark</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insight section */}
        <div className="card-highlight animate-fadeInUp delay-200" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h3>🤖 AI Personal Insight</h3>
              <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>Get a personalized analysis based on your data</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={generateAiInsight}
              disabled={aiLoading}
              id="generate-ai-insight"
            >
              {aiLoading ? '⏳ Analyzing...' : '✨ Generate Insight'}
            </button>
          </div>
          {aiTip && (
            <div style={{
              background: 'hsla(220,18%,12%,0.7)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              borderLeft: '3px solid var(--green-400)',
              animation: 'fadeInUp 0.4s ease',
            }}>
              <p style={{ lineHeight: 1.8, color: 'var(--text-primary)' }}>
                {aiTip.split('**').map((part, i) =>
                  i % 2 === 1
                    ? <strong key={i} style={{ color: 'var(--green-300)' }}>{part}</strong>
                    : part
                )}
              </p>
            </div>
          )}
          {!aiTip && !aiLoading && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
              <p>Click &quot;Generate Insight&quot; to get your personalized analysis.</p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="animate-fadeInUp delay-400">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2>💡 Reduction Tips</h2>
            <span className="badge badge-green">Personalized for you</span>
          </div>
          <div className="grid-2">
            {relevantTips.slice(0, 6).map((tip, i) => (
              <div key={i} className="card" style={{ borderLeft: `3px solid ${COLORS[tip.category as keyof typeof COLORS] || 'var(--border)'}` }}>
                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '2rem', flexShrink: 0 }}>{tip.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <h4>{tip.title}</h4>
                      <ImpactBadge impact={tip.impact} />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tip.description}</p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--green-300)', fontWeight: 600 }}>
                        💚 Saves ~{tip.savingKg} kg/year
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        ⚡ Effort: {tip.effort}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
