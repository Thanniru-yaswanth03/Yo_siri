'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import {
  MessageSquareIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  TheaterIcon,
  BarChart3Icon,
  TrophyIcon,
  SettingsIcon,
  SunIcon,
  MoonIcon,
  MenuIcon,
  XIcon,
  FlameIcon,
  SparklesIcon,
  MicIcon,
} from '@/components/icons';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: SparklesIcon },
  { name: 'Free Conversation', href: '/conversation', icon: MessageSquareIcon },
  { name: 'Interview Room', href: '/interview', icon: BriefcaseIcon },
  { name: 'English Lab', href: '/english-lab', icon: GraduationCapIcon },
  { name: 'Roleplay Studio', href: '/roleplay', icon: TheaterIcon },
  { name: 'Progress Reports', href: '/progress', icon: BarChart3Icon },
  { name: 'Daily Challenges', href: '/challenges', icon: TrophyIcon, badge: '3 New' },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

// Top 4 mobile primary actions
const mobilePrimaryNav = [
  { name: 'Home', href: '/', icon: SparklesIcon },
  { name: 'Practice', href: '/conversation', icon: MicIcon },
  { name: 'Interviews', href: '/interview', icon: BriefcaseIcon },
  { name: 'Progress', href: '/progress', icon: BarChart3Icon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-150">
      {/* Desktop Sidebar (Warm Editorial Style) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--border-subtle)] justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-lg tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-[#244C3B] rounded-md"
          >
            <div className="w-8 h-8 rounded-lg bg-[#244C3B] dark:bg-[#467D60] flex items-center justify-center text-white shadow-sm">
              <MicIcon size={18} />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight font-serif font-bold text-[var(--text-primary)]">Yo Siri</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#78947B] dark:text-[#8CA890]">
                Voice Coach
              </span>
            </div>
          </Link>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            v2.0
          </span>
        </div>

        {/* Quick Launch Action */}
        <div className="p-4">
          <Link
            href="/conversation"
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#244C3B] hover:bg-[#1B3B2E] dark:bg-[#467D60] dark:hover:bg-[#589676] text-white font-medium text-sm shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#244C3B]"
          >
            <MicIcon size={16} />
            <span>Start Practice</span>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          <p className="px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Practice Studios
          </p>
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-[44px] flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#244C3B] ${
                  isActive
                    ? 'bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={isActive ? 'text-[#244C3B] dark:text-[#E2F0E6]' : 'text-[var(--text-muted)]'}
                  />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}

          <div className="pt-4">
            <p className="px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Analytics & Insights
            </p>
            {navItems.slice(5).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`min-h-[44px] flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#244C3B] ${
                    isActive
                      ? 'bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={isActive ? 'text-[#244C3B] dark:text-[#E2F0E6]' : 'text-[var(--text-muted)]'}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FBF0EC] text-[#D87558] dark:bg-[#3D2924] dark:text-[#EDA089]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#78947B]" />
              <span>Ollama Ready</span>
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">gpt-oss</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Brand */}
            <div className="flex lg:hidden items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#244C3B] dark:bg-[#467D60] flex items-center justify-center text-white">
                <MicIcon size={16} />
              </div>
              <span className="font-serif font-bold text-lg text-[var(--text-primary)]">Yo Siri</span>
            </div>

            {/* Context Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#78947B]" />
              <span>Voice Coach & Fluency Lab</span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Counter */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FBF0EC] dark:bg-[#3D2924] border border-[#D87558]/30 text-[#D87558] dark:text-[#EDA089] text-xs font-semibold"
              title="Practice Streak"
            >
              <FlameIcon size={14} className="text-[#D87558]" />
              <span>Day 0</span>
            </div>

            {/* Daily Target Pill */}
            <div
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs font-medium"
              title="Daily speaking target"
            >
              <span className="w-2 h-2 rounded-full bg-[#244C3B] dark:bg-[#467D60] animate-pulse" />
              <span>Target: 0/15m</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#244C3B] transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <SunIcon size={18} className="text-amber-400" />
              ) : (
                <MoonIcon size={18} className="text-[#292E29]" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile "More" Drawer Sheet */}
        {moreMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMoreMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-full max-h-[85vh] bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] rounded-t-3xl p-5 z-10 shadow-2xl space-y-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#244C3B] dark:bg-[#467D60] flex items-center justify-center text-white">
                    <MicIcon size={16} />
                  </div>
                  <span className="font-serif font-bold text-base text-[var(--text-primary)]">All Learning Rooms</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                  aria-label="Close menu"
                >
                  <XIcon size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreMenuOpen(false)}
                      className={`min-h-[52px] flex items-center gap-3 p-3 text-sm font-medium rounded-xl border transition-colors ${
                        isActive
                          ? 'bg-[#E8EFE9] border-[#244C3B]/30 text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6] font-semibold'
                          : 'bg-[var(--bg-elevated)]/60 border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Icon
                        size={18}
                        className={isActive ? 'text-[#244C3B] dark:text-[#E2F0E6]' : 'text-[var(--text-muted)]'}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Display Theme</span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center gap-2 font-medium"
                >
                  {theme === 'dark' ? <SunIcon size={16} className="text-amber-400" /> : <MoonIcon size={16} />}
                  <span>{theme === 'dark' ? 'Dark Forest' : 'Warm Ivory'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Viewport with mobile bottom navigation spacing */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {children}
        </main>

        {/* Mobile Fixed Bottom Navigation Bar (Primary Practice Targets) */}
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border-subtle)] px-2 py-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom))] shadow-lg flex items-center justify-around"
        >
          {mobilePrimaryNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-[44px] min-w-[56px] flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                  isActive
                    ? 'text-[#244C3B] dark:text-[#467D60] font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    isActive ? 'bg-[#E8EFE9] dark:bg-[#25382B]' : ''
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[11px] leading-none tracking-tight">{item.name}</span>
              </Link>
            );
          })}

          {/* More menu trigger */}
          <button
            type="button"
            onClick={() => setMoreMenuOpen(true)}
            className="min-h-[44px] min-w-[56px] flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl transition-colors"
            aria-label="More navigation items"
          >
            <div className="p-1 rounded-lg">
              <MenuIcon size={18} />
            </div>
            <span className="text-[11px] leading-none tracking-tight">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
