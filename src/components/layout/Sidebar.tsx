'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Package, Beaker, Sparkles, Syringe,
  BookOpen, Sun, Settings, Gem, Heart, Menu, X, FileText, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/lib/store';

const navItems = [
  { href: '/', label: 'Shelf', icon: Home },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/routine', label: 'Routine', icon: Sun },
  { href: '/ingredients', label: 'Ingredients', icon: Beaker },
  { href: '/insights', label: 'AI Insights', icon: Sparkles },
  { href: '/procedures', label: 'Procedures', icon: Syringe },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/journal', label: 'Skin Journal', icon: BookOpen },
  { href: '/articles', label: 'Articles', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

// Bottom nav items for mobile (most important 5)
const mobileNavItems = [
  { href: '/', label: 'Shelf', icon: Home },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/routine', label: 'Routine', icon: Sun },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/insights', label: 'Insights', icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const profile = useUserProfile();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: '#1C1917' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #C9A96E, #B5622A)' }}>
            <Gem className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-widest uppercase"
            style={{ color: '#FAF7F2', fontFamily: 'var(--font-display)' }}>
            GlowShelf
          </span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg"
          style={{ color: 'rgba(250,247,242,0.7)' }}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile slide-down menu ── */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="md:hidden fixed top-[52px] left-0 right-0 z-50 py-2 px-3 space-y-0.5"
            style={{ backgroundColor: '#1C1917' }}>
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                    active ? 'font-medium' : ''
                  )}
                  style={active ? {
                    backgroundColor: 'rgba(181,98,42,0.18)',
                    color: '#C9A96E',
                  } : {
                    color: 'rgba(250,247,242,0.55)',
                  }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0"
                    style={{ color: active ? '#C9A96E' : 'rgba(250,247,242,0.35)' }} />
                  {label}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around"
        style={{
          backgroundColor: '#1C1917',
          borderTop: '1px solid rgba(201,169,110,0.15)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-0"
            >
              <Icon className="w-5 h-5" style={{ color: active ? '#C9A96E' : 'rgba(250,247,242,0.35)' }} />
              <span className="text-[10px] truncate" style={{ color: active ? '#C9A96E' : 'rgba(250,247,242,0.4)' }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 min-h-screen flex-col fixed left-0 top-0 bottom-0 z-40"
        style={{ backgroundColor: '#1C1917' }}>

        {/* Logo */}
        <div className="px-6 py-6" style={{ borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #C9A96E, #B5622A)' }}>
              <Gem className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-display font-semibold text-sm leading-none tracking-widest uppercase"
                style={{ color: '#FAF7F2', fontFamily: 'var(--font-display)' }}>
                GlowShelf
              </div>
              <div className="text-xs mt-0.5 tracking-wider uppercase"
                style={{ color: 'rgba(201,169,110,0.7)', fontSize: '9px' }}>
                Skincare Manager
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                  active
                    ? 'font-medium'
                    : 'hover:opacity-80'
                )}
                style={active ? {
                  backgroundColor: 'rgba(181,98,42,0.18)',
                  color: '#C9A96E',
                } : {
                  color: 'rgba(250,247,242,0.55)',
                }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: active ? '#C9A96E' : 'rgba(250,247,242,0.35)' }}
                />
                {label}
                {label === 'AI Insights' && (
                  <span className="ml-auto text-xs rounded-sm px-1.5 py-0.5 font-medium tracking-wider"
                    style={{ backgroundColor: 'rgba(201,169,110,0.15)', color: '#C9A96E', fontSize: '9px' }}>
                    AI
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin link */}
        <div className="px-3 pb-2">
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all',
              pathname.startsWith('/admin') ? 'font-medium' : 'hover:opacity-80'
            )}
            style={pathname.startsWith('/admin') ? {
              backgroundColor: 'rgba(181,98,42,0.18)',
              color: '#C9A96E',
            } : {
              color: 'rgba(250,247,242,0.3)',
            }}
          >
            <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: pathname.startsWith('/admin') ? '#C9A96E' : 'rgba(250,247,242,0.2)' }} />
            Admin
          </Link>
        </div>

        {/* Thin gold rule */}
        <div className="mx-6" style={{ height: '1px', background: 'rgba(201,169,110,0.15)' }} />

        {/* User profile */}
        <div className="px-4 py-5">
          <Link href="/settings" className="flex items-center gap-3 group">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #B5622A, #C9A96E)' }}
            >
              {profile.name ? profile.name[0].toUpperCase() : '✦'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate transition-colors"
                style={{ color: 'rgba(250,247,242,0.8)', fontFamily: 'var(--font-sans)' }}>
                {profile.name || 'Your Profile'}
              </div>
              <div className="text-xs capitalize"
                style={{ color: 'rgba(201,169,110,0.6)' }}>
                {profile.skinType} skin
              </div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
