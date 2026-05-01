'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '../../../lib/api';
import { useEditorStore } from '../../../store';
import { Project, Layout } from '../../../types';
import type Konva from 'konva';

const CanvasEditor = dynamic(() => import('../../../components/canvas/CanvasEditor'), { ssr: false });

export default function ShareClient() {
  const { token } = useParams<{ token: string }>();
  const stageRef = useRef<Konva.Stage | null>(null);
  const { loadLayout } = useEditorStore();
  const [project, setProject] = useState<Project | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/projects/public/${token}`)
      .then(res => {
        const p = res.data.project as Project & { layouts: Layout[] };
        setProject(p);
        const l = p.layouts?.[0];
        if (l) {
          setLayout(l);
          loadLayout(l.layoutJson.elements || [], l.layoutJson.venueWidth, l.layoutJson.venueHeight);
        }
      })
      .catch(() => setError('This layout could not be found or the link has expired.'))
      .finally(() => setLoading(false));
  }, [token, loadLayout]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <p style={{ color: 'var(--text3)', fontSize: 13 }}>Loading shared layout…</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h2 style={{ marginBottom: 8 }}>Layout Not Found</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ height: 50, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>⬡</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16 }}>EventFlow</span>
          <span style={{ color: 'var(--border2)' }}>·</span>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{project?.name}</span>
        </div>
        <span className="badge badge-accent" style={{ fontSize: 11 }}>👁 View Only</span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
        <CanvasEditor stageRef={stageRef} />
      </div>
      {layout && (
        <div style={{ padding: '10px 20px', background: 'var(--surface)', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 16 }}>
          <span>Layout: <strong style={{ color: 'var(--text2)' }}>{layout.name}</strong></span>
          <span>Version: <strong style={{ color: 'var(--text2)' }}>v{layout.version}</strong></span>
          <span>Owner: <strong style={{ color: 'var(--text2)' }}>{project?.owner?.name}</strong></span>
        </div>
      )}
    </div>
  );
}
