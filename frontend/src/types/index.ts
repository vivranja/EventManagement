export type ElementType =
  | 'round-table'
  | 'rect-table'
  | 'chair'
  | 'stage'
  | 'wall'
  | 'booth'
  | 'bar'
  | 'dancefloor'
  | 'text-label';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  label: string;
  seats: number;
  opacity: number;
  locked: boolean;
  zIndex: number;
  fontSize?: number;
}

export interface LayoutJSON {
  version: string;
  venueWidth: number;
  venueHeight: number;
  elements: CanvasElement[];
  background: string;
  backgroundOpacity?: number;
  gridSize: number;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'PLANNER' | 'CLIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  venueWidth: number;
  venueHeight: number;
  eventDate?: string;
  ownerId: string;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string; email: string };
  _count?: { layouts: number };
}

export interface Layout {
  id: string;
  projectId: string;
  name: string;
  layoutJson: LayoutJSON;
  version: number;
  isActive: boolean;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  elements: CanvasElement[];
}
