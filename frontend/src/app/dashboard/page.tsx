'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { projectsApi } from '../../lib/api';
import { useAuthStore } from '../../store';
import { Project } from '../../types';
import { format } from 'date-fns';

const CARD_GRADIENTS = [
  'linear-gradient(135deg,#7c3aed 0%,#db2777 100%)',
  'linear-gradient(135deg,#0891b2 0%,#7c3aed 100%)',
  'linear-gradient(135deg,#059669 0%,#0891b2 100%)',
  'linear-gradient(135deg,#d97706 0%,#dc2626 100%)',
  'linear-gradient(135deg,#9333ea 0%,#06b6d4 100%)',
  'linear-gradient(135deg,#db2777 0%,#9333ea 100%)',
];

function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: Project) => void }) {
  const [form, setForm] = useState({ name: '', description: '', venueWidth: 1000, venueHeight: 750, eventDate: '' });
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await projectsApi.create(form);
      onCreate(res.data.project);
      toast.success('Project created!');
      onClose();
    } catch {
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, padding: 30, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.5),0 0 0 1px rgba(124,58,237,0.15)' }} className="anim-fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 19, fontWeight: 700 }}>New Event Project</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Event Name *</label>
            <input className="input" placeholder="e.g. Annual Gala 2025" required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="Optional description" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Venue Width (px)</label>
              <input className="input" type="number" min={200} max={5000} value={form.venueWidth}
                onChange={e => setForm(f => ({ ...f, venueWidth: +e.target.value }))} />
            </div>
            <div>
              <label className="label">Venue Height (px)</label>
              <input className="input" type="number" min={200} max={5000} value={form.venueHeight}
                onChange={e => setForm(f => ({ ...f, venueHeight: +e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Event Date</label>
            <input className="input" type="date" value={form.eventDate}
              onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await projectsApi.list();
      setProjects(res.data.projects);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    load();
  }, [user, router, load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await projectsApi.delete(id);
      setProjects(p => p.filter(x => x.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const roleColor = (r: string) => r === 'ADMIN' ? 'badge-amber' : r === 'PLANNER' ? 'badge-accent' : 'badge-emerald';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      {/* Ambient background glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', top: '-150px', right: '-100px', background: 'radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%)' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', bottom: '0px', left: '-100px', background: 'radial-gradient(circle,rgba(232,121,249,0.05) 0%,transparent 70%)' }} />
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav style={{ background: 'rgba(13,13,38,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#7c3aed,#e879f9)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, boxShadow: '0 0 14px rgba(124,58,237,0.5)' }}>⬡</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18 }}>EventFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={`badge ${roleColor(user?.role || '')}`}>{user?.role}</span>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); router.push('/auth/login'); }}>Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '44px 24px', position: 'relative', zIndex: 1 }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 7, letterSpacing: '-.02em' }}>
              My Event Projects
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''} · Click any card to open the layout editor
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ gap: 8 }}>
            <span style={{ fontSize: 20, lineHeight: 1, marginTop: -1 }}>+</span> New Project
          </button>
        </div>

        {/* ── Grid ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text3)' }}>Loading projects…</div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px' }} className="anim-fade-up">
            <div style={{ fontSize: 56, marginBottom: 18, filter: 'drop-shadow(0 0 20px rgba(124,58,237,0.4))' }}>🎪</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>No projects yet</h3>
            <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 14 }}>Create your first event layout project to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create First Project</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 18 }}>
            {projects.map((p, i) => {
              const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
              const initial = p.name.charAt(0).toUpperCase();
              return (
                <div key={p.id} className="anim-fade-up glow-card" style={{ animationDelay: `${i * 55}ms`, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>

                  {/* Thumbnail */}
                  <div onClick={() => router.push(`/editor/${p.id}`)}
                    style={{ height: 148, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {/* subtle pattern */}
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 30%,rgba(255,255,255,0.08) 0%,transparent 50%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                      {p.venueWidth}×{p.venueHeight}
                    </div>
                    <span style={{ fontSize: 52, fontWeight: 700, color: 'rgba(255,255,255,0.22)', fontFamily: "'Playfair Display',serif", userSelect: 'none', lineHeight: 1 }}>
                      {initial}
                    </span>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '16px 18px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <Link href={`/editor/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{p.name}</h3>
                      </Link>
                      {p.ownerId === user?.id && (
                        <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                          style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 15, padding: '0 2px', lineHeight: 1, transition: 'color .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>✕</button>
                      )}
                    </div>

                    {p.description && (
                      <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>
                      <span>{p._count?.layouts || 0} layout{(p._count?.layouts || 0) !== 1 ? 's' : ''}</span>
                      {p.eventDate && (
                        <><span style={{ opacity: .5 }}>·</span><span style={{ color: 'var(--amber)' }}>{format(new Date(p.eventDate), 'MMM d, yyyy')}</span></>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/editor/${p.id}`}
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 12px', background: 'var(--grad-btn)', color: '#fff', borderRadius: 7, fontSize: 12, fontWeight: 500, textDecoration: 'none', boxShadow: '0 2px 10px rgba(124,58,237,0.35)', transition: 'box-shadow .15s,transform .15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(124,58,237,0.55)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(124,58,237,0.35)'; (e.currentTarget as HTMLElement).style.transform = ''; }}>
                        Open Editor →
                      </Link>
                      <button
                        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/share/${p.shareToken}`); toast.success('Share link copied!'); }}
                        style={{ padding: '7px 11px', background: 'var(--elevated)', border: '1px solid var(--border2)', borderRadius: 7, cursor: 'pointer', fontSize: 14, color: 'var(--text2)', transition: 'border-color .15s,background .15s' }}
                        title="Copy share link"
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent2)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent2)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}>
                        🔗
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} onCreate={p => setProjects(prev => [p, ...prev])} />}
    </div>
  );
}
