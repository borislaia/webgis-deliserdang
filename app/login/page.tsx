"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectTarget, setRedirectTarget] = useState<string>('/map');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('redirect');
    if (r) setRedirectTarget(r);
    // Handle implicit OAuth hash fallback (access_token/refresh_token in URL fragment)
    (async () => {
      const hash = window.location.hash && window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : ''
      if (hash) {
        const hp = new URLSearchParams(hash)
        const access_token = hp.get('access_token')
        const refresh_token = hp.get('refresh_token')
        if (access_token && refresh_token) {
          try {
            await fetch('/auth/callback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token, refresh_token })
            })
            // Clean URL (remove hash) before redirect
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
            window.location.href = r || '/map'
            return
          } catch (_) {
            // no-op; fallback to session check
          }
        }
      }

      // If already logged in, redirect away from login page
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        window.location.href = r || '/map'
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Bridge client session to secure HTTP-only cookies on server
    if (data?.session) {
      await fetch('/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        })
      });
    }
    window.location.href = redirectTarget;
  }

  async function onLoginWithGoogle() {
    setLoading(true);
    const params = new URLSearchParams(window.location.search);
    const r = params.get('redirect') || '/map';
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(r)}` },
      flowType: 'pkce'
    });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <main className="content" style={{ maxWidth: 400, margin: '60px auto' }}>
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={onLogin} className="card" style={{ padding: 16 }}>
        <div className="form-row">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-row" style={{ marginTop: 12 }}>
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          <button className="btn" type="button" onClick={onLoginWithGoogle} disabled={loading}>Login with Google</button>
        </div>
        <p style={{ marginTop: 12 }}>Belum punya akun? <Link href="/register">Register</Link></p>
      </form>
    </main>
  );
}
