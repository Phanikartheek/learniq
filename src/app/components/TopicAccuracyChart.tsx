'use client';
import React from 'react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
} from 'recharts';

const TOPIC_DATA = [
  { name: 'System Design', accuracy: 82, fill: 'var(--primary)' },
  { name: 'Algorithms', accuracy: 68, fill: 'var(--accent)' },
  { name: 'OS Concepts', accuracy: 54, fill: 'var(--cyan-accent)' },
  { name: 'Databases', accuracy: 45, fill: '#f59e0b' },
  { name: 'Networking', accuracy: 38, fill: '#ef4444' },
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; accuracy: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card rounded-xl px-3 py-2 shadow-glass border border-border">
      <p className="text-xs font-medium text-foreground">{d.name}</p>
      <p className="text-sm font-bold text-primary tabular-nums">{d.accuracy}%</p>
    </div>
  );
}

export default function TopicAccuracyChart() {
  return (
    <div className="glass-card rounded-2xl p-6 border border-border h-full">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-foreground">Topic Accuracy</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Accuracy across all quiz attempts</p>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <RadialBarChart
          cx="50%" cy="50%"
          innerRadius="20%"
          outerRadius="90%"
          data={TOPIC_DATA}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar dataKey="accuracy" cornerRadius={4} background={{ fill: 'var(--muted)' }} />
          <Tooltip content={<CustomTooltip />} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {TOPIC_DATA.map((t) => (
          <div key={`topic-${t.name}`} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.fill }} />
              <span className="text-xs text-muted-foreground truncate">{t.name}</span>
            </div>
            <span className={`text-xs font-semibold tabular-nums ${t.accuracy < 60 ? 'text-red-400' : t.accuracy < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {t.accuracy}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}