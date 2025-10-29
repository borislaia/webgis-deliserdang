"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LoginPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectTo = decodeURIComponent(searchParams.get('redirect') || '/dashboard');

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
    // Persist session cookies on the server via route handler
    await fetch('/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'SIGNED_IN', session: data.session }),
    }).catch(() => {});
    router.replace(redirectTo);
  }

  async function onLoginWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}` }
    });
    setLoading(false);
    if (error) setError(error.message);
  }

  useEffect(() => {
    // If already logged in, go straight to redirect target
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(redirectTo);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
