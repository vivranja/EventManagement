'use client';
import { CanvasElement } from '../../types';

interface Props {
  element: CanvasElement | null;
  onChange: (updates: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  totalElements: number;
  totalSeats: number;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 12 }}>
    <label className="label">{label}</label>
    {children}
  </div>
);

export default function PropertiesPanel({ element, onChange, onDelete, onDuplicate, onBringForward, onSendBackward, totalElements, totalSeats }: Props) {
  if (!element) {
    return (
      <div style={{ width: 220, minWidth: 220, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Properties</p>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>👆</div>
          <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>Select an element on the canvas to edit its properties</p>
        </div>
        {/* Canvas stats */}
        <div style={{ padding: '14px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Canvas Stats</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--elevated)', borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent2)' }}>{totalElements}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>Elements</div>
            </div>
            <div style={{ background: 'var(--elevated)', borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--emerald)' }}>{totalSeats}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>Seats</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const num = (val: string) => (val === '' ? 0 : parseFloat(val));

  return (
    <div style={{ width: 220, minWidth: 220, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '14px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Properties</p>
        <p style={{ fontSize: 11, color: 'var(--accent2)', marginTop: 2, textTransform: 'capitalize' }}>
          {element.type.replace('-', ' ')}
        </p>
      </div>

      <div style={{ padding: '14px' }}>
        <Field label="Label">
          <input className="input" value={element.label} onChange={e => onChange({ label: e.target.value })} />
        </Field>

        <Field label="Position">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>X</span>
              <input className="input" type="number" value={Math.round(element.x)}
                onChange={e => onChange({ x: num(e.target.value) })} style={{ padding: '5px 8px' }} />
            </div>
            <div>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>Y</span>
              <input className="input" type="number" value={Math.round(element.y)}
                onChange={e => onChange({ y: num(e.target.value) })} style={{ padding: '5px 8px' }} />
            </div>
          </div>
        </Field>

        <Field label="Size">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>W</span>
              <input className="input" type="number" min={10} value={Math.round(element.width)}
                onChange={e => onChange({ width: Math.max(10, num(e.target.value)) })} style={{ padding: '5px 8px' }} />
            </div>
            <div>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>H</span>
              <input className="input" type="number" min={10} value={Math.round(element.height)}
                onChange={e => onChange({ height: Math.max(10, num(e.target.value)) })} style={{ padding: '5px 8px' }} />
            </div>
          </div>
        </Field>

        <Field label="Rotation (°)">
          <input className="input" type="number" min={-360} max={360} value={Math.round(element.rotation)}
            onChange={e => onChange({ rotation: num(e.target.value) })} />
          <input type="range" min={-180} max={180} value={element.rotation}
            onChange={e => onChange({ rotation: num(e.target.value) })}
            style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent)' }} />
        </Field>

        <Field label="Fill Color">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={element.fill} onChange={e => onChange({ fill: e.target.value })}
              style={{ width: 36, height: 28, borderRadius: 5, border: '1px solid var(--border2)', cursor: 'pointer', background: 'none', padding: 2 }} />
            <input className="input" value={element.fill} onChange={e => onChange({ fill: e.target.value })} style={{ flex: 1, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
          </div>
        </Field>

        <Field label="Stroke Color">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={element.stroke} onChange={e => onChange({ stroke: e.target.value })}
              style={{ width: 36, height: 28, borderRadius: 5, border: '1px solid var(--border2)', cursor: 'pointer', background: 'none', padding: 2 }} />
            <input className="input" value={element.stroke} onChange={e => onChange({ stroke: e.target.value })} style={{ flex: 1, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
          </div>
        </Field>

        <Field label="Opacity">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="range" min={0.1} max={1} step={0.05} value={element.opacity}
              onChange={e => onChange({ opacity: parseFloat(e.target.value) })}
              style={{ flex: 1, accentColor: 'var(--accent)' }} />
            <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 32 }}>{Math.round(element.opacity * 100)}%</span>
          </div>
        </Field>

        {(element.type === 'round-table' || element.type === 'rect-table') && (
          <Field label="Seats">
            <input className="input" type="number" min={1} max={30} value={element.seats}
              onChange={e => onChange({ seats: Math.max(1, parseInt(e.target.value) || 1) })} />
          </Field>
        )}

        {element.type === 'text-label' && (
          <Field label="Font Size">
            <input className="input" type="number" min={8} max={80} value={element.fontSize || 16}
              onChange={e => onChange({ fontSize: parseInt(e.target.value) || 16 })} />
          </Field>
        )}

        <Field label="Lock Element">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="lock" checked={element.locked}
              onChange={e => onChange({ locked: e.target.checked })}
              style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }} />
            <label htmlFor="lock" style={{ fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
              {element.locked ? '🔒 Locked' : '🔓 Unlocked'}
            </label>
          </div>
        </Field>

        {/* Layer controls */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
          <p className="label" style={{ marginBottom: 8 }}>Layer Order</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={onBringForward} style={{ justifyContent: 'center', fontSize: 12 }}>↑ Forward</button>
            <button className="btn btn-ghost btn-sm" onClick={onSendBackward} style={{ justifyContent: 'center', fontSize: 12 }}>↓ Backward</button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={onDuplicate} style={{ justifyContent: 'center' }}>⧉ Duplicate</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete} style={{ justifyContent: 'center' }}>✕ Delete</button>
        </div>
      </div>
    </div>
  );
}
