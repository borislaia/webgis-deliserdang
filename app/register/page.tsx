"use client";
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

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
    <main className="content" style={{ maxWidth: 400, margin: '60px auto' }}>
      <h2>Register</h2>
      {error && <div className="error-message">{error}</div>}
      {info && <div className="card" style={{ padding: 12 }}>{info}</div>}
      <form onSubmit={onRegister} className="card" style={{ padding: 16 }}>
        <div className="form-row">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-row" style={{ marginTop: 12 }}>
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
        </div>
        <p style={{ marginTop: 12 }}>Sudah punya akun? <Link href="/login">Login</Link></p>
      </form>
    </main>
  );
}
