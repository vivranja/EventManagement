import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/layouts/:projectId
router.get('/:projectId', async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findFirst({
    where: {
      id: req.params.projectId,
      OR: [
        { ownerId: req.user!.id },
        { shares: { some: { userId: req.user!.id } } },
      ],
    },
  });
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const layouts = await prisma.layout.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { version: 'desc' },
  });
  res.json({ layouts });
});

// POST /api/layouts
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = z.object({
      projectId: z.string(),
      name: z.string().optional().default('Untitled Layout'),
      layoutJson: z.any(),
      thumbnail: z.string().optional(),
    }).parse(req.body);

    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        OR: [
          { ownerId: req.user!.id },
          { shares: { some: { userId: req.user!.id, canEdit: true } } },
        ],
      },
    });
    if (!project) return res.status(403).json({ error: 'No access to project' });

    const latest = await prisma.layout.findFirst({
      where: { projectId: data.projectId },
      orderBy: { version: 'desc' },
    });

    const layout = await prisma.layout.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        layoutJson: data.layoutJson,
        thumbnail: data.thumbnail,
        version: (latest?.version ?? 0) + 1,
      },
    });
    res.status(201).json({ layout });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    throw err;
  }
});

// PUT /api/layouts/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const layout = await prisma.layout.findUnique({ where: { id: req.params.id } });
  if (!layout) return res.status(404).json({ error: 'Layout not found' });

  const project = await prisma.project.findFirst({
    where: {
      id: layout.projectId,
      OR: [
        { ownerId: req.user!.id },
        { shares: { some: { userId: req.user!.id, canEdit: true } } },
      ],
    },
  });
  if (!project) return res.status(403).json({ error: 'No permission' });

  const updated = await prisma.layout.update({
    where: { id: req.params.id },
    data: {
      layoutJson: req.body.layoutJson,
      name: req.body.name ?? layout.name,
      thumbnail: req.body.thumbnail ?? layout.thumbnail,
      updatedAt: new Date(),
    },
  });
  res.json({ layout: updated });
});

// DELETE /api/layouts/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const layout = await prisma.layout.findUnique({ where: { id: req.params.id } });
  if (!layout) return res.status(404).json({ error: 'Layout not found' });

  const project = await prisma.project.findFirst({
    where: { id: layout.projectId, ownerId: req.user!.id },
  });
  if (!project) return res.status(403).json({ error: 'No permission' });

  await prisma.layout.delete({ where: { id: req.params.id } });
  res.json({ message: 'Layout deleted' });
});

export default router;
