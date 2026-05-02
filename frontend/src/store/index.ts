import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, CanvasElement, HistoryEntry } from '../types';

// ─── Auth Store ───────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') localStorage.setItem('ef_token', token);
        set({ user, token });
      },
      logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('ef_token');
        set({ user: null, token: null });
      },
    }),
    { name: 'ef-auth' }
  )
);

// ─── Editor Store ─────────────────────────────────────────────────────────────
const MAX_HISTORY = 50;

interface EditorState {
  elements: CanvasElement[];
  selectedId: string | null;
  history: HistoryEntry[];
  historyIndex: number;
  gridEnabled: boolean;
  gridSize: number;
  snapEnabled: boolean;
  zoom: number;
  isDirty: boolean;
  venueWidth: number;
  venueHeight: number;

  backgroundImageUrl: string | null;
  backgroundOpacity: number;
  setBackgroundImage: (url: string | null) => void;
  setBackgroundOpacity: (opacity: number) => void;

  setElements: (els: CanvasElement[]) => void;
  addElement: (el: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setGrid: (v: boolean) => void;
  setSnap: (v: boolean) => void;
  setZoom: (z: number) => void;
  setVenueDimensions: (w: number, h: number) => void;
  loadLayout: (els: CanvasElement[], w: number, h: number, bgUrl?: string | null, bgOpacity?: number) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  markClean: () => void;
  clearCanvas: () => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  elements: [],
  selectedId: null,
  history: [],
  historyIndex: -1,
  gridEnabled: true,
  gridSize: 20,
  snapEnabled: true,
  zoom: 1,
  isDirty: false,
  venueWidth: 1000,
  venueHeight: 750,
  backgroundImageUrl: null,
  backgroundOpacity: 1,

  setBackgroundImage: (backgroundImageUrl) => set({ backgroundImageUrl }),
  setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity, isDirty: true }),

  setElements: (elements) => set({ elements, isDirty: true }),

  addElement: (el) => {
    const els = [...get().elements, el];
    set({ elements: els, isDirty: true, selectedId: el.id });
    get().pushHistory();
  },

  updateElement: (id, updates) => {
    const elements = get().elements.map((el) => (el.id === id ? { ...el, ...updates } : el));
    set({ elements, isDirty: true });
  },

  removeElement: (id) => {
    set({ elements: get().elements.filter((el) => el.id !== id), selectedId: null, isDirty: true });
    get().pushHistory();
  },

  duplicateElement: (id) => {
    const el = get().elements.find((e) => e.id === id);
    if (!el) return;
    get().addElement({ ...el, id: `el-${Date.now()}`, x: el.x + 24, y: el.y + 24 });
  },

  selectElement: (id) => set({ selectedId: id }),

  setGrid: (gridEnabled) => set({ gridEnabled }),
  setSnap: (snapEnabled) => set({ snapEnabled }),
  setZoom: (zoom) => set({ zoom: Math.max(0.2, Math.min(3, zoom)) }),
  setVenueDimensions: (venueWidth, venueHeight) => set({ venueWidth, venueHeight }),

  loadLayout: (elements, venueWidth, venueHeight, bgUrl = null, bgOpacity = 1) =>
    set({ elements, venueWidth, venueHeight, backgroundImageUrl: bgUrl, backgroundOpacity: bgOpacity, isDirty: false, history: [], historyIndex: -1, selectedId: null }),

  pushHistory: () => {
    const { elements, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: JSON.parse(JSON.stringify(elements)) });
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;
    set({ elements: history[historyIndex - 1].elements, historyIndex: historyIndex - 1, isDirty: true });
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;
    set({ elements: history[historyIndex + 1].elements, historyIndex: historyIndex + 1, isDirty: true });
  },

  markClean: () => set({ isDirty: false }),
  clearCanvas: () => {
    set({ elements: [], selectedId: null, isDirty: true });
    get().pushHistory();
  },

  bringForward: (id) => {
    const els = [...get().elements];
    const idx = els.findIndex((e) => e.id === id);
    if (idx < els.length - 1) {
      [els[idx], els[idx + 1]] = [els[idx + 1], els[idx]];
      set({ elements: els, isDirty: true });
    }
  },

  sendBackward: (id) => {
    const els = [...get().elements];
    const idx = els.findIndex((e) => e.id === id);
    if (idx > 0) {
      [els[idx], els[idx - 1]] = [els[idx - 1], els[idx]];
      set({ elements: els, isDirty: true });
    }
  },
}));
