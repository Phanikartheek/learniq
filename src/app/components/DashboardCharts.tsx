'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const ScoreTrendChart = dynamic(() => import('./ScoreTrendChart'), { ssr: false });
const TopicAccuracyChart = dynamic(() => import('./TopicAccuracyChart'), { ssr: false });

export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2">
        <ScoreTrendChart />
      </div>
      <div className="xl:col-span-1">
        <TopicAccuracyChart />
      </div>
    </div>
  );
}