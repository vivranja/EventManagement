'use client';
import { useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { useEditorStore } from '../../store';
import ElementShape from './ElementShape';
import type Konva from 'konva';

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function CanvasEditor({ stageRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    elements, selectedId, gridEnabled, gridSize, snapEnabled, zoom,
    venueWidth, venueHeight,
    selectElement, updateElement, removeElement, duplicateElement,
    setZoom, bringForward, sendBackward, pushHistory,
  } = useEditorStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        removeElement(selectedId);
      } else if (e.key === 'Escape') {
        selectElement(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateElement(selectedId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, removeElement, selectElement, duplicateElement]);

  // Undo/redo keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          useEditorStore.getState().undo();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault();
          useEditorStore.getState().redo();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition()!;
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.15, Math.min(4, newScale));
    setZoom(clampedScale);
    stage.scale({ x: clampedScale, y: clampedScale });
    stage.position({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  }, [stageRef, setZoom]);

  // Build grid lines
  const gridLines = [];
  if (gridEnabled) {
    for (let x = 0; x <= venueWidth; x += gridSize) {
      gridLines.push(<Line key={`v${x}`} points={[x, 0, x, venueHeight]} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />);
    }
    for (let y = 0; y <= venueHeight; y += gridSize) {
      gridLines.push(<Line key={`h${y}`} points={[0, y, venueWidth, y]} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />);
    }
  }

  const containerW = containerRef.current?.offsetWidth || 800;
  const containerH = containerRef.current?.offsetHeight || 600;

  return (
    <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', position: 'relative', background: 'var(--bg)' }}
      onClick={e => { if (e.target === containerRef.current) selectElement(null); }}>
      <Stage
        ref={stageRef}
        width={containerW}
        height={containerH}
        draggable
        onWheel={handleWheel}
        onClick={(e) => { if (e.target === e.target.getStage()) selectElement(null); }}
        onTap={(e) => { if (e.target === e.target.getStage()) selectElement(null); }}
        style={{ cursor: 'default' }}
      >
        <Layer>
          {/* Venue background */}
          <Rect
            x={0} y={0}
            width={venueWidth} height={venueHeight}
            fill="#1a1a2e"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={2}
            shadowBlur={20}
            shadowColor="rgba(108,99,255,0.15)"
          />

          {/* Grid */}
          {gridLines}

          {/* Venue border accent */}
          <Rect x={0} y={0} width={venueWidth} height={venueHeight}
            fill="transparent" stroke="rgba(108,99,255,0.3)" strokeWidth={2} />

          {/* Elements */}
          {elements.map((el) => (
            <ElementShape
              key={el.id}
              el={el}
              isSelected={el.id === selectedId}
              onSelect={() => selectElement(el.id)}
              onChange={(updates) => {
                updateElement(el.id, updates);
              }}
              onDragEndCommit={() => pushHistory()}
              snapEnabled={snapEnabled}
              gridSize={gridSize}
            />
          ))}
        </Layer>
      </Stage>

      {/* Zoom indicator */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text2)',
      }}>
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
