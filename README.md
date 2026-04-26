# EventFlow — 2D Event Layout Planning Platform

A full-stack SaaS platform for event planners to design, collaborate on, and share 2D event layouts. Similar to Social Tables and Prismm.

---

## 🗂 Project Structure

```
eventflow/
├── backend/                    # Node.js + Express API
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── index.ts            # Express server entry point
│   │   ├── seed.ts             # Database seed script
│   │   ├── lib/
│   │   │   └── prisma.ts       # Prisma client singleton
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT + role-based middleware
│   │   └── routes/
│   │       ├── auth.ts         # POST /signup, /login, GET /me
│   │       ├── projects.ts     # CRUD for projects + share tokens
│   │       └── layouts.ts      # CRUD for canvas layouts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── frontend/                   # Next.js 14 + React + TypeScript
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx          # Root layout + fonts
    │   │   ├── page.tsx            # Root redirect
    │   │   ├── globals.css         # Design system CSS
    │   │   ├── auth/
    │   │   │   ├── login/page.tsx  # Login page
    │   │   │   └── signup/page.tsx # Signup page
    │   │   ├── dashboard/
    │   │   │   └── page.tsx        # Projects dashboard
    │   │   ├── editor/
    │   │   │   └── [id]/page.tsx   # Main layout editor
    │   │   └── share/
    │   │       └── [token]/page.tsx # Read-only share view
    │   ├── components/
    │   │   ├── canvas/
    │   │   │   ├── CanvasEditor.tsx    # Konva Stage + grid + zoom
    │   │   │   └── ElementShape.tsx    # Shape renderers per element type
    │   │   └── panels/
    │   │       ├── ElementPalette.tsx  # Left panel: draggable element list
    │   │       ├── PropertiesPanel.tsx # Right panel: selected element props
    │   │       └── EditorToolbar.tsx   # Top bar: save/export/share/undo
    │   ├── store/
    │   │   └── index.ts            # Zustand stores (auth + editor)
    │   ├── lib/
    │   │   └── api.ts              # Axios API client
    │   └── types/
    │       └── index.ts            # TypeScript interfaces
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    └── .env.example
```

---

## ⚡ Tech Stack

| Layer        | Technology                              |
|-------------|----------------------------------------|
| Frontend    | Next.js 14, React 18, TypeScript       |
| Canvas      | Konva.js + react-konva                 |
| Styling     | Tailwind CSS + CSS Variables           |
| State       | Zustand (with persist middleware)      |
| Backend     | Node.js + Express + TypeScript         |
| Database    | PostgreSQL + Prisma ORM                |
| Auth        | JWT (jsonwebtoken) + bcryptjs          |
| HTTP Client | Axios                                  |

---

## 🚀 Local Setup

### Prerequisites
- Node.js ≥ 18
- PostgreSQL (local or Supabase/Neon)
- npm or yarn

---

### 1. Clone & install

```bash
git clone https://github.com/your-org/eventflow.git
cd eventflow

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

---

### 2. Configure environment

**Backend** — copy and edit:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/eventflow"
JWT_SECRET="your-super-long-random-secret-here"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

**Frontend** — copy and edit:
```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

### 3. Set up the database

```bash
cd backend

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# (Optional) Seed with demo data
npm run db:seed
```

Seed creates:
- `admin@eventflow.com` / `admin1234`
- `planner@eventflow.com` / `planner1234`

---

### 4. Run the servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → http://localhost:4000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → http://localhost:3000
```

Open `http://localhost:3000` in your browser.

---

## 🌐 Deployment

### Database — Supabase (recommended, free tier)

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection string (URI)
3. Copy the connection string for `DATABASE_URL`
4. Run migrations: `npx prisma migrate deploy`

Or use **Neon** at [neon.tech](https://neon.tech) — same process.

---

### Backend — Render

1. Push your code to GitHub
2. Create a new **Web Service** at [render.com](https://render.com)
3. Connect your GitHub repo, set root directory to `backend/`
4. Configure:
   - **Build command:** `npm install && npx prisma generate && npm run build`
   - **Start command:** `npm start`
5. Add environment variables:
   ```
   DATABASE_URL=<your Supabase/Neon connection string>
   JWT_SECRET=<strong random string>
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   PORT=4000
   ```

---

### Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo, set root directory to `frontend/`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   ```
4. Deploy!

---

## 📡 API Reference

### Authentication
| Method | Endpoint           | Description           | Auth? |
|--------|--------------------|-----------------------|-------|
| POST   | /api/auth/signup   | Create account        | No    |
| POST   | /api/auth/login    | Login, returns JWT    | No    |
| GET    | /api/auth/me       | Get current user      | Yes   |

### Projects
| Method | Endpoint               | Description           | Auth? |
|--------|------------------------|-----------------------|-------|
| GET    | /api/projects          | List user's projects  | Yes   |
| POST   | /api/projects          | Create project        | Yes   |
| GET    | /api/projects/:id      | Get project details   | Yes   |
| PUT    | /api/projects/:id      | Update project        | Yes   |
| DELETE | /api/projects/:id      | Delete project        | Yes   |
| GET    | /api/projects/public/:token | Public share view | No  |

### Layouts
| Method | Endpoint                | Description           | Auth? |
|--------|-------------------------|-----------------------|-------|
| GET    | /api/layouts/:projectId | List project layouts  | Yes   |
| POST   | /api/layouts            | Create layout         | Yes   |
| PUT    | /api/layouts/:id        | Update layout JSON    | Yes   |
| DELETE | /api/layouts/:id        | Delete layout         | Yes   |

---

## 🏗 Database Schema

```prisma
User       id, name, email, password (hashed), role (ADMIN/PLANNER/CLIENT)
Project    id, name, description, venueWidth, venueHeight, eventDate, ownerId, shareToken
Layout     id, projectId, name, layoutJson (JSON), version, isActive, thumbnail
ProjectShare id, projectId, userId, canEdit
```

### Layout JSON Structure

```json
{
  "version": "1.0",
  "venueWidth": 1000,
  "venueHeight": 750,
  "background": "#1a1a2e",
  "gridSize": 20,
  "elements": [
    {
      "id": "el-abc123",
      "type": "round-table",
      "x": 200,
      "y": 300,
      "width": 90,
      "height": 90,
      "rotation": 0,
      "fill": "#c8a97e",
      "stroke": "rgba(255,255,255,0.3)",
      "strokeWidth": 1.5,
      "label": "Table 1",
      "seats": 8,
      "opacity": 1,
      "locked": false,
      "zIndex": 1
    }
  ],
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z"
}
```

---

## 🎨 Canvas Element Types

| Type         | Description              | Default Size   | Has Seats |
|-------------|--------------------------|----------------|-----------|
| round-table  | Circular table w/ chairs | 90×90          | Yes (8)   |
| rect-table   | Rectangular banquet table| 160×70         | Yes (10)  |
| chair        | Single chair             | 30×30          | Yes (1)   |
| stage        | Performance stage area   | 280×120        | No        |
| wall         | Room divider/wall        | 160×16         | No        |
| booth        | Vendor or info booth     | 100×80         | No        |
| bar          | Bar or buffet station    | 200×60         | No        |
| dancefloor   | Open dance area          | 200×180        | No        |
| text-label   | Text annotation          | 120×30         | No        |

---

## ⌨️ Keyboard Shortcuts

| Shortcut       | Action              |
|----------------|---------------------|
| Delete / Backspace | Remove selected |
| Ctrl+Z         | Undo                |
| Ctrl+Y / Ctrl+Shift+Z | Redo      |
| Ctrl+D         | Duplicate selected  |
| Escape         | Deselect            |
| Scroll wheel   | Zoom in/out         |

---

## ✅ Features Checklist

- [x] JWT authentication with role-based access (Admin/Planner/Client)
- [x] bcrypt password hashing
- [x] Projects: create, list, update, delete, share via token
- [x] 2D canvas editor with Konva.js
- [x] 9 draggable element types
- [x] Grid display system
- [x] Snap-to-grid (toggleable)
- [x] Move, resize, rotate elements
- [x] Element properties inspector (position, size, color, rotation, opacity)
- [x] Undo/redo (50-step history)
- [x] Layer ordering (bring forward / send backward)
- [x] Element duplication + locking
- [x] Seating capacity auto-calculation
- [x] Layout versioning
- [x] Save layout as JSON to database
- [x] Load saved layouts
- [x] Export as PNG (2× resolution)
- [x] Export as PDF (via print)
- [x] Shareable read-only link
- [x] Zoom in/out (mouse wheel + buttons)
- [x] Thumbnail capture on save
- [x] Keyboard shortcuts
- [ ] Real-time collaboration (Phase 2 — add Socket.io)
- [ ] Cursor tracking (Phase 2)
- [ ] Collision detection (Phase 3)

---

## 🔌 Phase 2: Real-time Collaboration

To add real-time collaboration with Socket.io:

```bash
# Backend
npm install socket.io
npm install -D @types/socket.io

# Frontend
npm install socket.io-client
```

Add to `backend/src/index.ts`:
```typescript
import { Server } from 'socket.io';
import http from 'http';

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.FRONTEND_URL } });

io.on('connection', (socket) => {
  socket.on('join-project', (projectId: string) => {
    socket.join(projectId);
  });

  socket.on('canvas-update', ({ projectId, elements }) => {
    socket.to(projectId).emit('canvas-update', { elements });
  });

  socket.on('cursor-move', ({ projectId, cursor }) => {
    socket.to(projectId).emit('cursor-move', { userId: socket.id, ...cursor });
  });
});

httpServer.listen(PORT);
```

Then in the frontend editor, connect to the socket and broadcast element changes.

---

## 🧪 Testing the API

Using curl or any REST client:

```bash
# Signup
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@test.com","password":"secret123","role":"PLANNER"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@test.com","password":"secret123"}'

# List projects (replace TOKEN)
curl http://localhost:4000/api/projects \
  -H "Authorization: Bearer TOKEN"

# Create project
curl -X POST http://localhost:4000/api/projects \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Event","venueWidth":1200,"venueHeight":900}'
```

---

## 🔒 Security Notes

- Always change `JWT_SECRET` to a long random string in production
- Use HTTPS in production (Vercel/Render provide this automatically)
- Database passwords should be strong and never committed to git
- The `.env` files are in `.gitignore` — never commit them

---

## 📄 License

MIT © EventFlow
