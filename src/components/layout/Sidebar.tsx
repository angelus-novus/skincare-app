'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  Beaker,
  Sparkles,
  Syringe,
  BookOpen,
  Sun,
  Settings,
  Heart,
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
  { href: '/journal', label: 'Skin Journal', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const profile = useUserProfile();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 bottom-0 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-300 rounded-xl flex items-center justify-center shadow-sm">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm leading-none">GlowShelf</div>
            <div className="text-xs text-slate-400 mt-0.5">Skincare Manager</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-rose-50 text-rose-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              <Icon className={cn('w-4 h-4', active ? 'text-rose-500' : 'text-slate-400')} />
              {label}
              {label === 'AI Insights' && (
                <span className="ml-auto text-xs bg-rose-100 text-rose-600 rounded-full px-1.5 py-0.5 font-semibold">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-4 py-4 border-t border-slate-50">
        <Link href="/settings" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 to-pink-200 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {profile.name ? profile.name[0].toUpperCase() : 'Y'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-700 truncate group-hover:text-rose-600 transition-colors">
              {profile.name || 'Your Profile'}
            </div>
            <div className="text-xs text-slate-400 capitalize">{profile.skinType} skin</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
