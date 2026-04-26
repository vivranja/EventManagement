import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  venueWidth: z.number().positive().optional().default(1000),
  venueHeight: z.number().positive().optional().default(750),
  eventDate: z.string().optional(),
});

// GET /api/projects
router.get('/', async (req: AuthRequest, res: Response) => {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: req.user!.id },
        { shares: { some: { userId: req.user!.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { layouts: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ projects });
});

// POST /api/projects
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = projectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        venueWidth: data.venueWidth ?? 1000,
        venueHeight: data.venueHeight ?? 750,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        ownerId: req.user!.id,
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ project });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    throw err;
  }
});

// GET /api/projects/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findFirst({
    where: {
      id: req.params.id,
      OR: [
        { ownerId: req.user!.id },
        { shares: { some: { userId: req.user!.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      layouts: { orderBy: { version: 'desc' } },
      shares: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({ project });
});

// PUT /api/projects/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = projectSchema.partial().parse(req.body);
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, ownerId: req.user!.id },
    });
    if (!existing) return res.status(404).json({ error: 'Project not found or no permission' });

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...data,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
      },
    });
    res.json({ project: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    throw err;
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.project.findFirst({
    where: { id: req.params.id, ownerId: req.user!.id },
  });
  if (!existing) return res.status(404).json({ error: 'Project not found or no permission' });
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ message: 'Project deleted' });
});

// GET /api/projects/public/:token — no auth, read-only share
router.get('/public/:token', async (req, res: Response) => {
  const project = await prisma.project.findFirst({
    where: { shareToken: req.params.token },
    include: {
      owner: { select: { id: true, name: true } },
      layouts: { where: { isActive: true }, orderBy: { version: 'desc' }, take: 1 },
    },
  });
  if (!project) return res.status(404).json({ error: 'Not found' });
  res.json({ project });
});

export default router;
