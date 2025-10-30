"use client";
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else setInfo('Registrasi berhasil. Cek email untuk verifikasi.');
  }

  return (
    <main className="auth">
      <section className="auth-card card">
        <header className="auth-header">
          <div className="auth-logo">
            <Image src="/assets/icons/logo-deliserdang.jpg" alt="Logo Deli Serdang" width={56} height={56} />
          </div>
          <h2>Daftar</h2>
        </header>

        {error && (
          <div className="error-message" role="alert" aria-live="polite">{error}</div>
        )}

        <form onSubmit={onRegister} className="auth-form">
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Memproses…' : 'Daftar'}
          </button>

          {info && (
            <div className="success" role="status" aria-live="polite">{info}</div>
          )}
        </form>

        <footer className="auth-footer">
          Sudah punya akun? <Link href="/login">Masuk</Link>
        </footer>
      </section>
    </main>
  );
}
