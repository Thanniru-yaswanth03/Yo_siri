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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors duration-150">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-[#1E293B] justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-lg tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <MicIcon size={18} />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight font-bold text-slate-900 dark:text-white">Yo Siri</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-600 dark:text-indigo-400">
                Voice Coach
              </span>
            </div>
          </Link>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#172033] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
            P1
          </span>
        </div>

        {/* Quick Launch Action */}
        <div className="p-4">
          <Link
            href="/conversation"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
          >
            <MicIcon size={16} />
            <span>Start Speaking</span>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Practice Rooms
          </p>
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#172033]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}
                  />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}

          <div className="pt-4">
            <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Analytics & Insights
            </p>
            {navItems.slice(5).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#172033]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-200 dark:border-[#1E293B]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Ollama Ready</span>
            </div>
            <span className="font-mono text-[10px]">gpt-oss</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-slate-200 dark:border-[#1E293B] bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172033] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Open mobile menu"
            >
              <MenuIcon size={20} />
            </button>

            {/* Mobile Brand */}
            <div className="flex lg:hidden items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white">
                <MicIcon size={16} />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">Yo Siri</span>
            </div>

            {/* Context Breadcrumb / Mode Info */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Voice Coach & Fluency Lab</span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs font-semibold"
              title="Practice Streak"
            >
              <FlameIcon size={14} className="text-amber-500" />
              <span>Day 0</span>
            </div>

            {/* Daily Target Pill */}
            <div
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#172033] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium"
              title="Daily speaking target"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Target: 0/15m</span>
            </div>

            {/* Prototype Badge */}
            <span className="hidden xl:inline-block px-2.5 py-1 text-[11px] font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
              Phase 1 UI Prototype
            </span>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172033] border border-slate-200 dark:border-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <SunIcon size={18} className="text-amber-400" />
              ) : (
                <MoonIcon size={18} className="text-slate-700" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer */}
            <div className="relative w-72 max-w-[85%] bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-[#1E293B] flex flex-col p-4 z-10 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <MicIcon size={18} />
                  </div>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">Yo Siri</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#172033]"
                  aria-label="Close menu"
                >
                  <XIcon size={20} />
                </button>
              </div>

              <div className="my-4">
                <Link
                  href="/conversation"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-medium text-sm"
                >
                  <MicIcon size={16} />
                  <span>Start Speaking</span>
                </Link>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#172033]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-200 dark:border-[#1E293B] text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Theme</span>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800"
                  >
                    {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
