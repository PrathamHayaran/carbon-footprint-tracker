'use client';
import { useEffect, useRef } from 'react';

interface CarbonGaugeProps {
  value: number;    // current kg CO2
  max: number;      // max scale kg CO2
  target?: number;  // target kg CO2
  size?: number;
}

export default function CarbonGauge({ value, max, target = 5.2, size = 220 }: CarbonGaugeProps) {
  const circleRef = useRef<SVGCircleElement>(null);

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const dashOffset = circumference * (1 - percentage * 0.75); // 270° arc

  const getColor = () => {
    if (percentage < 0.4) return 'url(#gauge-green)';
    if (percentage < 0.7) return 'url(#gauge-amber)';
    return 'url(#gauge-red)';
  };

  const getLabel = () => {
    if (value < target * 0.5) return { text: 'Excellent', color: '#4ade80' };
    if (value < target)       return { text: 'Good',      color: '#4ade80' };
    if (value < target * 1.5) return { text: 'Moderate',  color: '#fb923c' };
    if (value < target * 2)   return { text: 'High',      color: '#f87171' };
    return { text: 'Critical', color: '#ef4444' };
  };

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.strokeDashoffset = String(circumference);
      setTimeout(() => {
        if (circleRef.current) {
          circleRef.current.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)';
          circleRef.current.style.strokeDashoffset = String(dashOffset);
        }
      }, 100);
    }
  }, [value, dashOffset, circumference]);

  const status = getLabel();
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="gauge-green" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(150,60%,50%)" />
            <stop offset="100%" stopColor="hsl(175,72%,45%)" />
          </linearGradient>
          <linearGradient id="gauge-amber" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(38,92%,58%)" />
            <stop offset="100%" stopColor="hsl(30,90%,55%)" />
          </linearGradient>
          <linearGradient id="gauge-red" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(0,72%,60%)" />
            <stop offset="100%" stopColor="hsl(350,70%,55%)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="hsl(222,14%,22%)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={circumference * 0.125}
          transform={`rotate(135 ${cx} ${cy})`}
        />

        {/* Value arc */}
        <circle
          ref={circleRef}
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={circumference}
          transform={`rotate(135 ${cx} ${cy})`}
          filter="url(#glow)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }}
        />

        {/* Target tick */}
        {(() => {
          const targetAngle = (135 + (target / max) * 270) * (Math.PI / 180);
          const tx = cx + (radius - 7) * Math.cos(targetAngle);
          const ty = cy + (radius - 7) * Math.sin(targetAngle);
          return (
            <circle cx={tx} cy={ty} r="4" fill="hsl(38,92%,58%)" opacity="0.8" />
          );
        })()}
      </svg>

      {/* Center text */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem',
      }}>
        <div style={{
          fontSize: '2.4rem',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          fontFamily: "var(--font-mono)",
          color: status.color,
          lineHeight: 1,
        }}>
          {value.toFixed(1)}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          kg CO₂e today
        </div>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: status.color,
          background: `${status.color}20`,
          padding: '0.15rem 0.6rem',
          borderRadius: '999px',
          border: `1px solid ${status.color}40`,
          marginTop: '0.25rem',
        }}>
          {status.text}
        </div>
      </div>
    </div>
  );
}
