import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import {
  PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamo, TABLE } from '../lib/dynamo';
import { authenticate, AuthRequest } from '../middleware/auth';
import { putLayoutJson, getLayoutJson, deleteLayoutJson, putImageFile, getPresignedUrl } from '../lib/s3';

const router = Router();
router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

async function checkProjectAccess(
  projectId: string,
  userId: string,
  requireEdit = false,
): Promise<Record<string, unknown> | null> {
  const result = await dynamo.send(new GetCommand({
    TableName: TABLE,
    Key: { pk: `PROJECT#${projectId}`, sk: `PROJECT#${projectId}` },
  }));
  const project = result.Item as Record<string, unknown> | undefined;
  if (!project) return null;
  if (project.ownerId === userId) return project;

  const shareResult = await dynamo.send(new GetCommand({
    TableName: TABLE,
    Key: {
      pk: `PROJECT#${projectId}#SHARE#${userId}`,
      sk: `PROJECT#${projectId}#SHARE#${userId}`,
    },
  }));
  const share = shareResult.Item;
  if (!share) return null;
  if (requireEdit && !share.canEdit) return null;
  return project;
}

// GET /api/layouts/:projectId
router.get('/:projectId', async (req: AuthRequest, res: Response) => {
  const project = await checkProjectAccess(req.params.projectId, req.user!.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const layoutsResult = await dynamo.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression: 'gsi1pk = :pk',
    ExpressionAttributeValues: { ':pk': `PROJECT#${req.params.projectId}` },
  }));

  const sorted = (layoutsResult.Items || []).sort(
    (a, b) => (b.version as number) - (a.version as number),
  );

  const layouts = await Promise.all(
    sorted.map(async layout => {
      const [layoutJson, backgroundImageUrl] = await Promise.all([
        layout.s3Key ? getLayoutJson(layout.s3Key as string) : null,
        layout.backgroundImageKey ? getPresignedUrl(layout.backgroundImageKey as string) : null,
      ]);
      return { ...layout, layoutJson, backgroundImageUrl };
    }),
  );

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

    const project = await checkProjectAccess(data.projectId, req.user!.id, false);
    if (!project) return res.status(403).json({ error: 'No access to project' });

    const existingResult = await dynamo.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': `PROJECT#${data.projectId}` },
    }));
    const maxVersion = (existingResult.Items || []).reduce(
      (max, l) => Math.max(max, l.version as number),
      0,
    );

    const id = uuidv4();
    const s3Key = `layouts/${data.projectId}/${id}.json`;
    const now = new Date().toISOString();

    await putLayoutJson(s3Key, data.layoutJson);

    const layoutItem = {
      pk: `LAYOUT#${id}`,
      sk: `LAYOUT#${id}`,
      gsi1pk: `PROJECT#${data.projectId}`,
      gsi1sk: `LAYOUT#${id}`,
      type: 'LAYOUT',
      id,
      projectId: data.projectId,
      name: data.name,
      s3Key,
      version: maxVersion + 1,
      isActive: true,
      thumbnail: data.thumbnail,
      createdAt: now,
      updatedAt: now,
    };

    await dynamo.send(new PutCommand({ TableName: TABLE, Item: layoutItem }));
    res.status(201).json({ layout: { ...layoutItem, layoutJson: data.layoutJson, backgroundImageUrl: null } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    throw err;
  }
});

// PUT /api/layouts/:id/background — upload floor plan image
router.put('/:id/background', upload.single('image'), async (req: AuthRequest, res: Response) => {
  const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
  if (!file) return res.status(400).json({ error: 'No image file provided' });

  const layoutResult = await dynamo.send(new GetCommand({
    TableName: TABLE,
    Key: { pk: `LAYOUT#${req.params.id}`, sk: `LAYOUT#${req.params.id}` },
  }));
  const layout = layoutResult.Item;
  if (!layout) return res.status(404).json({ error: 'Layout not found' });

  const project = await checkProjectAccess(layout.projectId as string, req.user!.id, false);
  if (!project) return res.status(403).json({ error: 'No permission' });

  const bgKey = `backgrounds/${layout.projectId}/${req.params.id}`;
  await putImageFile(bgKey, file.buffer, file.mimetype);

  await dynamo.send(new UpdateCommand({
    TableName: TABLE,
    Key: { pk: `LAYOUT#${req.params.id}`, sk: `LAYOUT#${req.params.id}` },
    UpdateExpression: 'SET backgroundImageKey = :key, updatedAt = :now',
    ExpressionAttributeValues: { ':key': bgKey, ':now': new Date().toISOString() },
  }));

  const backgroundImageUrl = await getPresignedUrl(bgKey);
  res.json({ backgroundImageUrl });
});

// DELETE /api/layouts/:id/background — remove floor plan image
router.delete('/:id/background', async (req: AuthRequest, res: Response) => {
  const layoutResult = await dynamo.send(new GetCommand({
    TableName: TABLE,
    Key: { pk: `LAYOUT#${req.params.id}`, sk: `LAYOUT#${req.params.id}` },
  }));
  const layout = layoutResult.Item;
  if (!layout) return res.status(404).json({ error: 'Layout not found' });

  const project = await checkProjectAccess(layout.projectId as string, req.user!.id, false);
  if (!project) return res.status(403).json({ error: 'No permission' });

  if (layout.backgroundImageKey) {
    await Promise.all([
      deleteLayoutJson(layout.backgroundImageKey as string),
      dynamo.send(new UpdateCommand({
        TableName: TABLE,
        Key: { pk: `LAYOUT#${req.params.id}`, sk: `LAYOUT#${req.params.id}` },
        UpdateExpression: 'REMOVE backgroundImageKey SET updatedAt = :now',
        ExpressionAttributeValues: { ':now': new Date().toISOString() },
      })),
    ]);
  }

  res.json({ message: 'Background removed' });
});

// PUT /api/layouts/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const layoutResult = await dynamo.send(new GetCommand({
    TableName: TABLE,
    Key: { pk: `LAYOUT#${req.params.id}`, sk: `LAYOUT#${req.params.id}` },
  }));
  const layout = layoutResult.Item;
  if (!layout) return res.status(404).json({ error: 'Layout not found' });

  const project = await checkProjectAccess(layout.projectId as string, req.user!.id, false);
  if (!project) return res.status(403).json({ error: 'No permission' });

  if (req.body.layoutJson !== undefined) {
    await putLayoutJson(layout.s3Key as string, req.body.layoutJson);
  }

  const now = new Date().toISOString();
  const result = await dynamo.send(new UpdateCommand({
    TableName: TABLE,
    Key: { pk: `LAYOUT#${req.params.id}`, sk: `LAYOUT#${req.params.id}` },
    UpdateExpression: 'SET #name = :name, #thumbnail = :thumbnail, #updatedAt = :updatedAt',
    ExpressionAttributeNames: { '#name': 'name', '#thumbnail': 'thumbnail', '#updatedAt': 'updatedAt' },
    ExpressionAttributeValues: {
      ':name': req.body.name ?? layout.name,
      ':thumbnail': req.body.thumbnail ?? layout.thumbnail,
      ':updatedAt': now,
    },
    ReturnValues: 'ALL_NEW',
  }));

  const updatedLayout = result.Attributes!;
  const [layoutJson, backgroundImageUrl] = await Promise.all([
    req.body.layoutJson ?? getLayoutJson(layout.s3Key as string),
    updatedLayout.backgroundImageKey ? getPresignedUrl(updatedLayout.backgroundImageKey as string) : null,
  ]);
  res.json({ layout: { ...updatedLayout, layoutJson, backgroundImageUrl } });
});

// DELETE /api/layouts/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const layoutResult = await dynamo.send(new GetCommand({
    TableName: TABLE,
    Key: { pk: `LAYOUT#${req.params.id}`, sk: `LAYOUT#${req.params.id}` },
  }));
  const layout = layoutResult.Item;
  if (!layout) return res.status(404).json({ error: 'Layout not found' });

  const projectResult = await dynamo.send(new GetCommand({
    TableName: TABLE,
    Key: { pk: `PROJECT#${layout.projectId}`, sk: `PROJECT#${layout.projectId}` },
  }));
  if (!projectResult.Item || projectResult.Item.ownerId !== req.user!.id) {
    return res.status(403).json({ error: 'No permission' });
  }

  const deleteOps: Promise<unknown>[] = [
    deleteLayoutJson(layout.s3Key as string),
    dynamo.send(new DeleteCommand({
      TableName: TABLE,
      Key: { pk: `LAYOUT#${req.params.id}`, sk: `LAYOUT#${req.params.id}` },
    })),
  ];
  if (layout.backgroundImageKey) {
    deleteOps.push(deleteLayoutJson(layout.backgroundImageKey as string));
  }
  await Promise.all(deleteOps);

  res.json({ message: 'Layout deleted' });
});

export default router;
