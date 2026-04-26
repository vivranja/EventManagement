'use client';
import Link from 'next/link';
import { Project, Layout } from '../../types';
import { useEditorStore } from '../../store';

interface Props {
  project: Project | null;
  activeLayout: Layout | null;
  saving: boolean;
  onSave: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onShare: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onClearCanvas: () => void;
}

export default function EditorToolbar({
  project, activeLayout, saving,
  onSave, onExportPNG, onExportPDF, onShare,
  onToggleGrid, onToggleSnap, onClearCanvas,
}: Props) {
  const { isDirty, gridEnabled, snapEnabled, zoom, setZoom, undo, redo, history, historyIndex } = useEditorStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div style={{
      height: 50, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
      flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Logo + back */}
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', color: 'inherit', marginRight: 4 }}>
        <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>⬡</div>
      </Link>

      <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

      {/* Project name */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
          {project?.name || 'Loading…'}
        </div>
        {activeLayout && (
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>
            {activeLayout.name} · v{activeLayout.version}
            {isDirty && <span style={{ color: 'var(--amber)', marginLeft: 4 }}>● unsaved</span>}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Undo / Redo */}
      <button className="btn btn-ghost btn-sm" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ padding: '4px 8px' }}>↩</button>
      <button className="btn btn-ghost btn-sm" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" style={{ padding: '4px 8px' }}>↪</button>

      <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

      {/* Grid / Snap toggles */}
      <button className="btn btn-ghost btn-sm" onClick={onToggleGrid}
        style={{ fontSize: 11, background: gridEnabled ? 'var(--accent-d)' : undefined, borderColor: gridEnabled ? 'var(--accent)' : undefined, color: gridEnabled ? 'var(--accent2)' : undefined }}>
        Grid
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onToggleSnap}
        style={{ fontSize: 11, background: snapEnabled ? 'var(--accent-d)' : undefined, borderColor: snapEnabled ? 'var(--accent)' : undefined, color: snapEnabled ? 'var(--accent2)' : undefined }}>
        Snap
      </button>

      <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

      {/* Zoom controls */}
      <button className="btn btn-ghost btn-sm" onClick={() => setZoom(zoom - 0.1)} style={{ padding: '4px 8px' }}>−</button>
      <span style={{ fontSize: 11, color: 'var(--text2)', minWidth: 38, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
      <button className="btn btn-ghost btn-sm" onClick={() => setZoom(zoom + 0.1)} style={{ padding: '4px 8px' }}>+</button>
      <button className="btn btn-ghost btn-sm" onClick={() => setZoom(1)} style={{ fontSize: 10 }}>Reset</button>

      <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

      {/* Clear */}
      <button className="btn btn-ghost btn-sm" onClick={onClearCanvas} style={{ fontSize: 11, color: 'var(--red)', borderColor: 'rgba(248,113,113,.2)' }}>Clear</button>

      {/* Export */}
      <div style={{ position: 'relative', display: 'flex', gap: 4 }}>
        <button className="btn btn-ghost btn-sm" onClick={onExportPNG} style={{ fontSize: 11 }}>PNG</button>
        <button className="btn btn-ghost btn-sm" onClick={onExportPDF} style={{ fontSize: 11 }}>PDF</button>
        <button className="btn btn-ghost btn-sm" onClick={onShare} style={{ fontSize: 11 }}>🔗 Share</button>
      </div>

      {/* Save */}
      <button className="btn btn-primary btn-sm" onClick={onSave} disabled={saving} style={{ fontSize: 12, marginLeft: 4 }}>
        {saving ? 'Saving…' : isDirty ? '● Save' : '✓ Saved'}
      </button>
    </div>
  );
}
