'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authApi } from '../../../lib/api';
import { useAuthStore } from '../../../store';

const STATS = [
  { value: '300+', label: 'Events planned', color: '#a78bfa' },
  { value: '50k+', label: 'Layouts created', color: '#e879f9' },
  { value: '12k+', label: 'Planners', color: '#22d3ee' },
  { value: '99%',  label: 'Uptime',          color: '#34d399' },
];

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

      {/* ── Left panel ────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'space-between',
        padding: '52px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(145deg,#0a0420 0%,#0d0533 40%,#08102e 100%)',
        borderRight: '1px solid rgba(124,58,237,0.2)',
      }} className="lg:flex">

        {/* Floating orbs */}
        <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', top: '-80px', left: '-80px', background: 'radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%)', animation: 'orbDrift 12s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', bottom: '60px', right: '-60px', background: 'radial-gradient(circle,rgba(232,121,249,0.2) 0%,transparent 70%)', animation: 'orbDrift 16s ease-in-out infinite reverse', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', top: '45%', left: '55%', background: 'radial-gradient(circle,rgba(34,211,238,0.12) 0%,transparent 70%)', animation: 'orbDrift 10s ease-in-out infinite 2s', pointerEvents: 'none' }} />

        {/* Grid overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(120,100,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(120,100,255,.04) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#7c3aed,#e879f9)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 0 20px rgba(124,58,237,0.6)' }}>⬡</div>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 21, fontWeight: 700 }}>EventFlow</span>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 42, fontWeight: 700, lineHeight: 1.18, marginBottom: 20 }}>
            Design events<br />
            <span className="grad-text">with precision.</span>
          </h1>
          <p style={{ color: 'var(--text2)', lineHeight: 1.75, maxWidth: 340, fontSize: 15 }}>
            Professional 2D layout planning for event planners. Drag, drop, and collaborate in real-time.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, position: 'relative', zIndex: 1 }}>
          {STATS.map(({ value, label, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color, marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', position: 'relative' }}>
        {/* subtle bg glow */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', top: '20%', left: '30%', background: 'radial-gradient(circle,rgba(124,58,237,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }} className="anim-fade-up">

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }} className="lg:hidden">
            <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#7c3aed,#e879f9)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>⬡</div>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>EventFlow</span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-.02em' }}>Welcome back</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>Sign in to your workspace.</p>
          </div>

          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@example.com" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ marginTop: 4, justifyContent: 'center', padding: '11px 16px', fontSize: 14, borderRadius: 10 }}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '14px 16px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10 }}>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Demo credentials</p>
            <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: 'var(--accent2)' }}>planner@eventflow.com</p>
            <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text3)' }}>planner1234</p>
          </div>

          <p style={{ marginTop: 22, textAlign: 'center', fontSize: 13, color: 'var(--text2)' }}>
            No account?{' '}
            <Link href="/auth/signup" style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 600 }}>Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
