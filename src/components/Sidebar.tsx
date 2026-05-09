'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from './ui/AppLogo';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Brain,
  Mic,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Flame,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Icon from '@/components/ui/AppIcon';


interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
  group: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'nav-dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard, group: 'main' },
  { id: 'nav-documents', label: 'Document Hub', href: '/document-hub', icon: FileText, badge: 2, group: 'main' },
  { id: 'nav-chat', label: 'RAG Chat', href: '/rag-chat', icon: MessageSquare, group: 'main' },
  { id: 'nav-quiz', label: 'Quiz Engine', href: '/quiz-engine', icon: Brain, badge: 'New', group: 'practice' },
  { id: 'nav-interview', label: 'Mock Interview', href: '/mock-interview', icon: Mic, group: 'practice' },
  { id: 'nav-analytics', label: 'Analytics', href: '/analytics', icon: BarChart3, group: 'insights' },
  { id: 'nav-settings', label: 'Settings', href: '/settings', icon: Settings, group: 'account' },
];

const GROUP_LABELS: Record<string, string> = {
  main: 'Study',
  practice: 'Practice',
  insights: 'Insights',
  account: 'Account',
};

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const groups = Array.from(new Set(NAV_ITEMS.map((i) => i.group)));

  return (
    <aside
      className={`
        fixed lg:relative z-50 flex flex-col h-full
        glass-card border-r border-border
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-3 border-b border-border ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <AppLogo size={28} />
            <span className="font-display font-bold text-lg gradient-text truncate">LearnIQ</span>
          </div>
        )}
        {collapsed && <AppLogo size={28} />}
        <button
          onClick={() => { onToggleCollapse(); onMobileClose(); }}
          className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        {!collapsed && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Study streak */}
      {!collapsed && user && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 flex items-center gap-2">
          <Flame size={16} className="text-orange-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-orange-300">{user.studyStreak} day streak</p>
            <p className="text-[10px] text-orange-400/70 truncate">Keep it going!</p>
          </div>
        </div>
      )}
      {collapsed && user && (
        <div className="mx-auto mt-3 p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 group relative">
          <Flame size={16} className="text-orange-400" />
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-card border border-border rounded-lg text-xs text-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            {user.studyStreak} day streak
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-2 py-3 space-y-4">
        {groups.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          return (
            <div key={`group-${group}`}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {GROUP_LABELS[group]}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={onMobileClose}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-150 group relative
                        ${isActive
                          ? 'bg-primary/15 text-primary border border-primary/25' :'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }
                        ${collapsed ? 'justify-center' : ''}
                      `}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge !== undefined && (
                            <span className={`
                              text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0
                              ${typeof item.badge === 'number' ?'bg-primary/20 text-primary' :'bg-cyan-accent/20 text-cyan-400'
                              }
                            `}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && (
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-card border border-border rounded-lg text-xs text-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                          {item.label}
                          {item.badge !== undefined && (
                            <span className="ml-1 text-primary">({item.badge})</span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="border-t border-border p-3">
        {user ? (
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.role}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                aria-label="Log out"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        ) : (
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <BookOpen size={14} className="text-muted-foreground" />
            </div>
            {!collapsed && <span className="text-sm text-muted-foreground">Not signed in</span>}
          </div>
        )}
      </div>
    </aside>
  );
}