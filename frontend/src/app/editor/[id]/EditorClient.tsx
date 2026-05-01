'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { projectsApi, layoutsApi } from '../../../lib/api';
import { useAuthStore, useEditorStore } from '../../../store';
import { Project, Layout, CanvasElement, ElementType } from '../../../types';
import ElementPalette from '../../../components/panels/ElementPalette';
import PropertiesPanel from '../../../components/panels/PropertiesPanel';
import EditorToolbar from '../../../components/panels/EditorToolbar';
import type Konva from 'konva';

const CanvasEditor = dynamic(() => import('../../../components/canvas/CanvasEditor'), { ssr: false });

export default function EditorClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const stageRef = useRef<Konva.Stage | null>(null);

  const {
    elements, selectedId, venueWidth, venueHeight,
    addElement, updateElement, removeElement, duplicateElement,
    selectElement, loadLayout,
    setGrid, setSnap, gridEnabled, snapEnabled,
    clearCanvas, bringForward, sendBackward,
    markClean, isDirty,
  } = useEditorStore();

  const [project, setProject] = useState<Project | null>(null);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [activeLayout, setActiveLayout] = useState<Layout | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectedElement = elements.find((e) => e.id === selectedId) || null;
  const totalSeats = elements.reduce((sum, el) => sum + (el.seats || 0), 0);

  const loadProject = useCallback(async () => {
    try {
      const [projRes, layoutsRes] = await Promise.all([
        projectsApi.get(id),
        layoutsApi.list(id),
      ]);
      const proj = projRes.data.project as Project;
      const layoutList = layoutsRes.data.layouts as Layout[];

      setProject(proj);
      setLayouts(layoutList);

      const latest = layoutList.find((l) => l.isActive) || layoutList[0];
      if (latest) {
        setActiveLayout(latest);
        const lj = latest.layoutJson;
        loadLayout(lj.elements || [], lj.venueWidth || proj.venueWidth, lj.venueHeight || proj.venueHeight);
      } else {
        loadLayout([], proj.venueWidth, proj.venueHeight);
      }
    } catch {
      toast.error('Failed to load project');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, router, loadLayout]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadProject();
  }, [user, router, loadProject]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const layoutData = {
        version: '1.0',
        venueWidth,
        venueHeight,
        elements,
        background: '#1a1a2e',
        gridSize: 20,
        createdAt: activeLayout?.layoutJson.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let thumbnail: string | undefined;
      if (stageRef.current) {
        const stage = stageRef.current;
        const origScale = stage.scaleX();
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        thumbnail = stage.toDataURL({ pixelRatio: 0.3 });
        stage.scale({ x: origScale, y: origScale });
      }

      if (activeLayout) {
        const res = await layoutsApi.update(activeLayout.id, { layoutJson: layoutData, thumbnail });
        setActiveLayout(res.data.layout);
      } else {
        const res = await layoutsApi.create({ projectId: id, name: 'Layout v1', layoutJson: layoutData, thumbnail });
        setActiveLayout(res.data.layout);
        setLayouts((prev) => [res.data.layout, ...prev]);
      }

      markClean();
      toast.success('Layout saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddElement = (type: ElementType, opts: { defaultW: number; defaultH: number; color: string; seats?: number }) => {
    const newEl: CanvasElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      x: Math.floor(venueWidth / 2 - opts.defaultW / 2),
      y: Math.floor(venueHeight / 2 - opts.defaultH / 2),
      width: opts.defaultW,
      height: opts.defaultH,
      rotation: 0,
      fill: opts.color,
      stroke: 'rgba(255,255,255,0.3)',
      strokeWidth: 1.5,
      label: type.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      seats: opts.seats || 0,
      opacity: 1,
      locked: false,
      zIndex: elements.length,
      fontSize: 14,
    };
    addElement(newEl);
  };

  const handleExportPNG = () => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const origScale = stage.scaleX();
    const origPos = stage.position();
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    const uri = stage.toDataURL({ pixelRatio: 2 });
    stage.scale({ x: origScale, y: origScale });
    stage.position(origPos);
    const a = document.createElement('a');
    a.href = uri;
    a.download = `${project?.name || 'layout'}.png`;
    a.click();
    toast.success('Exported as PNG');
  };

  const handleExportPDF = () => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const origScale = stage.scaleX();
    const origPos = stage.position();
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    const uri = stage.toDataURL({ pixelRatio: 2 });
    stage.scale({ x: origScale, y: origScale });
    stage.position(origPos);

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>${project?.name || 'Layout'}</title>
      <style>body{margin:0}img{width:100%;page-break-after:always}</style></head>
      <body><img src="${uri}" onload="window.print();window.close()" /></body></html>
    `);
    win.document.close();
  };

  const handleShare = () => {
    if (!project) return;
    const url = `${window.location.origin}/share/${project.shareToken}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard!');
  };

  const handleClearCanvas = () => {
    if (!confirm('Clear all elements from the canvas?')) return;
    clearCanvas();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⬡</div>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>Loading editor…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <EditorToolbar
        project={project}
        activeLayout={activeLayout}
        saving={saving}
        onSave={handleSave}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        onShare={handleShare}
        onToggleGrid={() => setGrid(!gridEnabled)}
        onToggleSnap={() => setSnap(!snapEnabled)}
        onClearCanvas={handleClearCanvas}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ElementPalette onAdd={handleAddElement} />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CanvasEditor stageRef={stageRef} />
        </div>
        <PropertiesPanel
          element={selectedElement}
          onChange={(updates) => selectedId && updateElement(selectedId, updates)}
          onDelete={() => selectedId && removeElement(selectedId)}
          onDuplicate={() => selectedId && duplicateElement(selectedId)}
          onBringForward={() => selectedId && bringForward(selectedId)}
          onSendBackward={() => selectedId && sendBackward(selectedId)}
          totalElements={elements.length}
          totalSeats={totalSeats}
        />
      </div>
    </div>
  );
}
