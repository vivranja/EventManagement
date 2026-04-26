'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { projectsApi } from '../../lib/api';
import { useAuthStore } from '../../store';
import { Project } from '../../types';
import { format } from 'date-fns';

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480 }} className="anim-fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>New Event Project</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top nav */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⬡</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 17 }}>EventFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={`badge ${roleColor(user?.role || '')}`}>{user?.role}</span>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); router.push('/auth/login'); }}>Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 6 }}>
              My Event Projects
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''} · Click to open the layout editor
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Project
          </button>
        </div>

        {/* Projects grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>Loading projects…</div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }} className="anim-fade-up">
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎪</div>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No projects yet</h3>
            <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 14 }}>Create your first event layout project to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create First Project</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {projects.map((p, i) => (
              <div key={p.id} className="anim-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', transition: 'border-color .15s, transform .15s', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
                  {/* Canvas preview placeholder */}
                  <div onClick={() => router.push(`/editor/${p.id}`)}
                    style={{ height: 140, background: 'linear-gradient(135deg, var(--elevated) 0%, var(--hover) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, borderBottom: '1px solid var(--border)' }}>
                    🗺️
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <Link href={`/editor/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{p.name}</h3>
                      </Link>
                      {p.ownerId === user?.id && (
                        <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                          style={{ padding: '3px 8px', fontSize: 12, color: 'var(--red)', borderColor: 'transparent' }}>✕</button>
                      )}
                    </div>
                    {p.description && <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.5 }}>{p.description}</p>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'var(--text3)' }}>
                      <span>{p.venueWidth} × {p.venueHeight} px</span>
                      <span>·</span>
                      <span>{p._count?.layouts || 0} layout{(p._count?.layouts || 0) !== 1 ? 's' : ''}</span>
                      {p.eventDate && <><span>·</span><span>{format(new Date(p.eventDate), 'MMM d, yyyy')}</span></>}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <Link href={`/editor/${p.id}`}
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 12px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
                        Open Editor →
                      </Link>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/share/${p.shareToken}`); toast.success('Share link copied!'); }}
                        style={{ padding: '7px 10px', fontSize: 13 }} title="Copy share link">
                        🔗
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} onCreate={p => setProjects(prev => [p, ...prev])} />}
    </div>
  );
}
