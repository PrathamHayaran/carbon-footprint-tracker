'use client';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

interface TrendChartProps {
  data: number[];       // emission values per day (oldest → newest)
  type?: 'area' | 'bar';
  target?: number;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    const v = payload[0]?.value ?? 0;
    const color = v < 5.2 ? '#4ade80' : v < 10 ? '#fb923c' : '#f87171';
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        boxShadow: 'var(--shadow-md)',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{label}</p>
        <p style={{ color, fontWeight: 700, fontSize: '1.1rem', fontFamily: 'JetBrains Mono, monospace' }}>
          {v.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>kg CO₂e</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function TrendChart({ data, type = 'area', target = 5.2, height = 200 }: TrendChartProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();

  const chartData = data.map((value, i) => {
    const dayIndex = (today - (data.length - 1 - i) + 7) % 7;
    return { name: days[dayIndex], value: Math.round(value * 100) / 100 };
  });

  const gradientId = 'trendGradient';

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'area' ? (
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(156,52%,48%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(156,52%,48%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,14%,20%)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: 'hsl(220,12%,55%)', fontSize: 12 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(220,12%,55%)', fontSize: 12 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={target}
            stroke="hsl(38,92%,58%)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'Target', fill: 'hsl(38,92%,58%)', fontSize: 10 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(156,52%,48%)"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={{ fill: 'hsl(156,52%,48%)', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: 'hsl(175,72%,45%)', strokeWidth: 2, stroke: 'hsl(175,72%,55%)' }}
          />
        </AreaChart>
      ) : (
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,14%,20%)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: 'hsl(220,12%,55%)', fontSize: 12 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(220,12%,55%)', fontSize: 12 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={target} stroke="hsl(38,92%,58%)" strokeDasharray="4 4" strokeWidth={1.5} />
          <Bar
            dataKey="value"
            radius={[6, 6, 0, 0]}
            fill="hsl(156,52%,48%)"
          />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
