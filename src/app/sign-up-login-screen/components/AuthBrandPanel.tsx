import React from 'react';
import { BookOpen, Brain, TrendingUp, Mic } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';


const FEATURES = [
  { id: 'feat-rag', icon: BookOpen, title: 'Chat with your notes', desc: 'Upload any PDF or document and get instant AI-powered answers with source citations.' },
  { id: 'feat-quiz', icon: Brain, title: 'Adaptive quiz engine', desc: 'Topic-specific quizzes that get harder as you improve — with AI explanations for every answer.' },
  { id: 'feat-progress', icon: TrendingUp, title: 'Track your progress', desc: 'Visual dashboards show your score trends, weak topics, and readiness for your interview.' },
  { id: 'feat-interview', icon: Mic, title: 'AI mock interviews', desc: 'Practice with a voice-based AI interviewer and get scored feedback on every response.' },
];

export default function AuthBrandPanel() {
  return (
    <div className="relative w-full flex flex-col justify-between p-12 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/80 via-background to-background" />
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 blob-primary opacity-60" />
      <div className="absolute bottom-0 left-0 w-64 h-64 blob-cyan opacity-40" />
      <div className="relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-16">
          <AppLogo size={36} />
          <span className="font-display font-bold text-2xl gradient-text">LearnIQ</span>
        </div>

        {/* Hero copy */}
        <div className="mb-12">
          <h2 className="font-display font-bold text-4xl xl:text-5xl text-foreground leading-tight mb-4">
            Ace your next<br />
            <span className="gradient-text">technical interview.</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
            Upload your study materials, practice with AI, and track exactly what you need to improve — all in one place.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-5">
          {FEATURES?.map((f) => {
            const Icon = f?.icon;
            return (
              <div key={f?.id} className="flex items-start gap-4">
                <div className="p-2 rounded-xl bg-primary/15 border border-primary/25 flex-shrink-0 mt-0.5">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{f?.title}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-0.5">{f?.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Social proof */}
      <div className="relative z-10 flex items-center gap-4 mt-8">
        <div className="flex -space-x-2">
          {['AS', 'PM', 'RK', 'SK']?.map((initials, i) => (
            <div
              key={`avatar-${initials}`}
              className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: `hsl(${220 + i * 30}, 70%, 55%)`, transitionDelay: `${i * 80}ms` }}
            >
              {initials}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">2,400+</span> students preparing for interviews
        </p>
      </div>
    </div>
  );
}