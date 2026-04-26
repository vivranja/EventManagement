'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authApi } from '../../../lib/api';
import { useAuthStore } from '../../../store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form);
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px', background: 'var(--surface)', borderRight: '1px solid var(--border)',
        position: 'relative', overflow: 'hidden',
      }} className="lg:flex">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, rgba(108,99,255,.12) 0%, transparent 60%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⬡</div>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>EventFlow</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
            Design events<br />with precision.
          </h1>
          <p style={{ color: 'var(--text2)', lineHeight: 1.7, maxWidth: 340, fontSize: 15 }}>
            Professional 2D layout planning for event planners. Drag, drop, and collaborate in real-time.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, position: 'relative', zIndex: 1 }}>
          {[['300+', 'Events planned'], ['50k+', 'Layouts created'], ['12k+', 'Planners'], ['99%', 'Uptime']].map(([v, l]) => (
            <div key={l} style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent2)' }}>{v}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ width: '100%', maxWidth: 400 }} className="anim-fade-up">
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }} className="lg:hidden">
              <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⬡</div>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700 }}>EventFlow</span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Sign in</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>Welcome back. Enter your credentials to continue.</p>
          </div>

          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ marginTop: 4, justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Demo credentials:</p>
            <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text3)' }}>planner@eventflow.com / planner1234</p>
          </div>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text2)' }}>
            No account?{' '}
            <Link href="/auth/signup" style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 500 }}>Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
