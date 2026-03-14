'use client';
import { useState, useEffect, ReactNode } from 'react';
import { Lock, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SESSION_KEY = 'glowshelf-admin-auth';

export function useAdminAuth() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === 'true');
    setChecked(true);
  }, []);

  const login = (password: string): boolean => {
    const correct = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (password === correct) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  };

  return { authed, checked, login, logout };
}

export function AdminGate({ children }: { children: ReactNode }) {
  const { authed, checked, login } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!checked) return null;

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #C9A96E, #B5622A)' }}>
              <Gem className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-obsidian-800">Admin Access</h1>
            <p className="text-sm text-obsidian-400 mt-1">Enter your admin password to continue</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-ivory-darker p-6 space-y-4">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (!login(password)) setError(true);
                }
              }}
              error={error ? 'Incorrect password' : undefined}
            />
            <Button
              className="w-full"
              onClick={() => { if (!login(password)) setError(true); }}
            >
              <Lock className="w-4 h-4" /> Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
