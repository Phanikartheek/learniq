'use client';
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const SCORE_DATA = [
  { date: 'Apr 14', quiz: 58, interview: 52 },
  { date: 'Apr 17', quiz: 63, interview: 55 },
  { date: 'Apr 20', quiz: 61, interview: 60 },
  { date: 'Apr 23', quiz: 70, interview: 58 },
  { date: 'Apr 26', quiz: 68, interview: 65 },
  { date: 'Apr 29', quiz: 74, interview: 70 },
  { date: 'May 02', quiz: 72, interview: 68 },
  { date: 'May 05', quiz: 78, interview: 72 },
  { date: 'May 08', quiz: 74, interview: 68 },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl px-4 py-3 shadow-glass border border-border">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <p key={`tooltip-${p.name}`} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: <span className="tabular-nums">{p.value}%</span>
        </p>
      ))}
    </div>
  );
}

export default function ScoreTrendChart() {
  return (
    <div className="glass-card rounded-2xl p-6 border border-border h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-foreground">Score Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Quiz & interview scores over the past 3 weeks</p>
        </div>
        <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">↑ Improving</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={SCORE_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="quizGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="interviewGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cyan-accent)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--cyan-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
          <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
          <Area type="monotone" dataKey="quiz" name="Quiz" stroke="var(--primary)" strokeWidth={2} fill="url(#quizGrad)" dot={false} />
          <Area type="monotone" dataKey="interview" name="Interview" stroke="var(--cyan-accent)" strokeWidth={2} fill="url(#interviewGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}