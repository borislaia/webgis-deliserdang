"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LoginPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resolveSafeRedirect(raw: string | null | undefined, fallback = '/dashboard') {
    if (!raw) return fallback;
    let decoded = raw;
    try { decoded = decodeURIComponent(raw); } catch {}
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return fallback;
    return decoded;
  }

  const redirectTo = resolveSafeRedirect(searchParams.get('redirect'));

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError('Email atau kata sandi salah.');
      return;
    }
    try {
      // Persist session cookies on the server via route handler
      const resp = await fetch('/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'SIGNED_IN', session: data.session }),
      });
      if (!resp.ok) {
        let message = 'Gagal menyimpan sesi. Silakan coba lagi.';
        try { const j = await resp.json(); if (j?.error) message = j.error; } catch {}
        setLoading(false);
        setError(message);
        return;
      }
    } catch (e) {
      setLoading(false);
      setError('Gagal menyimpan sesi. Silakan coba lagi.');
      return;
    }
    setLoading(false);
    router.replace(redirectTo);
  }

  async function onLoginWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}` }
    });
    setLoading(false);
    if (error) setError('Gagal masuk dengan Google. Silakan coba lagi.');
  }

  useEffect(() => {
    // Jika sudah login, langsung redirect
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(redirectTo);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="auth">
      <section className="auth-card card">
        <header className="auth-header">
          <div className="auth-logo">
            <Image src="/assets/icons/logo-deliserdang.jpg" alt="Logo Deli Serdang" width={56} height={56} />
          </div>
          <h2>Masuk</h2>
          {/* <p className="auth-subtitle">Silakan login untuk melanjutkan</p> */}
        </header>

        <form onSubmit={onLogin} className="auth-form">
          <div className="form-row">
            <input
              id="email"
              className="input"
              type="email"
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <input
              id="password"
              className="input"
              type="password"
              placeholder="Kata sandi"
              aria-label="Kata sandi"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <div className="auth-divider"><span>atau</span></div>

        <button className="btn btn-block" type="button" onClick={onLoginWithGoogle} disabled={loading}>
          Lanjut dengan Google
        </button>

        {error && (
          <div className="error-message" role="alert" aria-live="polite">{error}</div>
        )}

        <footer className="auth-footer">
          Belum punya akun? <Link href="/register">Daftar</Link>
        </footer>
      </section>
    </main>
  );
}
