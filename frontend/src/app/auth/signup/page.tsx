'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authApi } from '../../../lib/api';
import { useAuthStore } from '../../../store';

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'PLANNER' });
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.signup(form);
      setAuth(res.data.user, res.data.token);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Signup failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', top: '-100px', right: '-100px', background: 'radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', bottom: '-80px', left: '-80px', background: 'radial-gradient(circle,rgba(232,121,249,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }} className="anim-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 32 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#7c3aed,#e879f9)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, boxShadow: '0 0 16px rgba(124,58,237,0.5)' }}>⬡</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700 }}>EventFlow</span>
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 7, letterSpacing: '-.02em' }}>Create account</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28 }}>Start planning beautiful events today.</p>

        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Full name</label>
            <input className="input" placeholder="Jane Smith" required value={form.name} onChange={f('name')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="jane@example.com" required value={form.email} onChange={f('email')} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Min 8 characters" required minLength={8} value={form.password} onChange={f('password')} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={f('role')} style={{ cursor: 'pointer' }}>
              <option value="PLANNER">Event Planner</option>
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ marginTop: 4, justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}>
            {loading ? 'Creating…' : 'Create account →'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text2)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 500 }}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
