'use client';
import { ElementType } from '../../types';

const ITEMS: { type: ElementType; label: string; icon: string; color: string; description: string; defaultW: number; defaultH: number; seats?: number }[] = [
  { type: 'round-table', label: 'Round Table', icon: '⊙', color: '#c8a97e', description: '8-seat circular table', defaultW: 90, defaultH: 90, seats: 8 },
  { type: 'rect-table', label: 'Rect Table', icon: '▭', color: '#b08050', description: 'Rectangular banquet table', defaultW: 160, defaultH: 70, seats: 10 },
  { type: 'chair', label: 'Chair', icon: '🪑', color: '#8b7355', description: 'Single chair', defaultW: 30, defaultH: 30, seats: 1 },
  { type: 'stage', label: 'Stage', icon: '🎭', color: '#4a5568', description: 'Performance stage area', defaultW: 280, defaultH: 120 },
  { type: 'wall', label: 'Wall/Divider', icon: '▬', color: '#64748b', description: 'Room divider or wall', defaultW: 160, defaultH: 16 },
  { type: 'booth', label: 'Booth', icon: '🏪', color: '#7c5cfc', description: 'Vendor or info booth', defaultW: 100, defaultH: 80 },
  { type: 'bar', label: 'Bar / Buffet', icon: '🍷', color: '#c0392b', description: 'Bar or buffet station', defaultW: 200, defaultH: 60 },
  { type: 'dancefloor', label: 'Dance Floor', icon: '💃', color: '#1a1a5e', description: 'Open dance area', defaultW: 200, defaultH: 180 },
  { type: 'text-label', label: 'Text Label', icon: 'T', color: '#ffffff', description: 'Add a text label', defaultW: 120, defaultH: 30 },
];

interface Props {
  onAdd: (type: ElementType, opts: { defaultW: number; defaultH: number; color: string; seats?: number }) => void;
}

export default function ElementPalette({ onAdd }: Props) {
  return (
    <div style={{ width: 220, minWidth: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Elements</p>
        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Click to add to canvas</p>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
        {ITEMS.map((item) => (
          <button key={item.type}
            onClick={() => onAdd(item.type, { defaultW: item.defaultW, defaultH: item.defaultH, color: item.color, seats: item.seats })}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', marginBottom: 4,
              background: 'var(--elevated)', border: '1px solid var(--border)',
              borderRadius: 7, cursor: 'pointer', textAlign: 'left',
              transition: 'border-color .12s, background .12s',
              color: 'var(--text)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--elevated)';
            }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6, flexShrink: 0,
              background: `${item.color}22`, border: `1px solid ${item.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{item.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{item.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick tips */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text2)' }}>Tips</strong><br />
        Del → remove selected<br />
        Ctrl+Z / Ctrl+Y → undo/redo<br />
        Scroll → zoom canvas
      </div>
    </div>
  );
}
