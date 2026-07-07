'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext, type AuthContextValue } from '@/hooks/useAuth';
import type { AuthUser } from '@/types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function restore() {
      try {
        const rt = await window.electronAPI?.invoke('get-refresh-token');
        if (!rt) return;

        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        });

        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          setUser(data.user);
        } else {
          await window.electronAPI?.invoke('clear-refresh-token');
        }
      } catch {
        // Not in Electron context (plain browser dev) — fall through
      } finally {
        setIsLoading(false);
      }
    }
    restore();
  }, []);

  // Silently refresh access token every 14 minutes
  useEffect(() => {
    if (!accessToken) return;
    const id = setInterval(async () => {
      try {
        const rt = await window.electronAPI?.invoke('get-refresh-token');
        if (!rt) return;
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        });
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
        }
      } catch { /* silent */ }
    }, 14 * 60 * 1000);
    return () => clearInterval(id);
  }, [accessToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      let res: Response;
      try {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
      } catch {
        throw new Error('Cannot reach the server. Make sure the app is fully started.');
      }

      // Always parse as JSON — the server is now guaranteed to return JSON on all paths
      const data = await res.json().catch(() => ({
        error: `Server returned an unexpected response (HTTP ${res.status}). Check that PostgreSQL is running.`,
      }));

      if (!res.ok) throw new Error(data.error ?? `Login failed (HTTP ${res.status})`);

      setAccessToken(data.accessToken);
      setUser(data.user);

      await window.electronAPI?.invoke('store-refresh-token', data.refreshToken);

      router.push('/dashboard');
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } finally {
      await window.electronAPI?.invoke('clear-refresh-token');
      setAccessToken(null);
      setUser(null);
      router.push('/login');
    }
  }, [accessToken, router]);

  const value: AuthContextValue = { user, accessToken, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
