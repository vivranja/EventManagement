import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  PutCommand, GetCommand, QueryCommand, UpdateCommand,
  DeleteCommand, BatchGetCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamo, TABLE } from '../lib/dynamo';
import { authenticate, AuthRequest } from '../middleware/auth';
import { deleteLayoutJson } from '../lib/s3';

const router = Router();

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  venueWidth: z.number().positive().optional().default(1000),
  venueHeight: z.number().positive().optional().default(750),
  eventDate: z.string().optional(),
});

// GET /api/projects/public/:token — no auth, read-only share
// Must be registered BEFORE router.use(authenticate)
router.get('/public/:token', async (req, res: Response) => {
  const result = await dynamo.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'GSI2',
    KeyConditionExpression: 'gsi2pk = :pk',
    ExpressionAttributeValues: { ':pk': `TOKEN#${req.params.token}` },
    Limit: 1,
  }));
  const project = result.Items?.[0];
  if (!project) return res.status(404).json({ error: 'Not found' });

  // Get the latest active layout
  const layoutsResult = await dynamo.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression: 'gsi1pk = :pk',
    ExpressionAttributeValues: { ':pk': `PROJECT#${project.id}` },
  }));
  const layouts = (layoutsResult.Items || [])
    .filter((l: Record<string, unknown>) => l.isActive)
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.version as number) - (a.version as number));

  res.json({
    project: {
      ...project,
      owner: { id: project.ownerId, name: project.ownerName },
      layouts: layouts.slice(0, 1),
    },
  });
});

router.use(authenticate);

// GET /api/projects
router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const [ownedResult, sharesResult] = await Promise.all([
    dynamo.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': `OWNER#${userId}` },
    })),
    dynamo.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': `COLLAB#${userId}` },
    })),
  ]);

  const ownedProjects = (ownedResult.Items || []) as Record<string, unknown>[];
  const shareItems = sharesResult.Items || [];
  let sharedProjects: Record<string, unknown>[] = [];

  if (shareItems.length > 0) {
    const batchResult = await dynamo.send(new BatchGetCommand({
      RequestItems: {
        [TABLE]: {
          Keys: shareItems.map((s: Record<string, unknown>) => ({
            pk: `PROJECT#${s.projectId}`,
            sk: `PROJECT#${s.projectId}`,
          })),
        },
      },
    }));
    sharedProjects = (batchResult.Responses?.[TABLE] || []) as Record<string, unknown>[];
  }

  const seen = new Set<string>();
  const projects = [...ownedProjects, ...sharedProjects]
    .filter(p => {
      const id = p.id as string;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .sort((a, b) => (b.updatedAt as string).localeCompare(a.updatedAt as string))
    .map(p => ({
      ...p,
      owner: { id: p.ownerId, name: p.ownerName, email: p.ownerEmail },
    }));

  res.json({ projects });
});

// POST /api/projects
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = projectSchema.parse(req.body);
    const userId = req.user!.id;

    const ownerResult = await dynamo.send(new GetCommand({
      TableName: TABLE,
      Key: { pk: `USER#${userId}`, sk: `USER#${userId}` },
    }));
    const owner = ownerResult.Item!;

    const id = uuidv4();
    const shareToken = uuidv4();
    const now = new Date().toISOString();

    const project = {
      pk: `PROJECT#${id}`,
      sk: `PROJECT#${id}`,
      gsi1pk: `OWNER#${userId}`,
      gsi1sk: `PROJ#${id}`,
      gsi2pk: `TOKEN#${shareToken}`,
      gsi2sk: `PROJECT#${id}`,
      type: 'PROJECT',
      id,
      name: data.name,
      description: data.description,
      venueWidth: data.venueWidth ?? 1000,
      venueHeight: data.venueHeight ?? 750,
      eventDate: data.eventDate || null,
      ownerId: userId,
      ownerName: owner.name,
      ownerEmail: owner.email,
      shareToken,
      createdAt: now,
      updatedAt: now,
    };

    await dynamo.send(new PutCommand({ TableName: TABLE, Item: project }));
    res.status(201).json({
      project: {
        ...project,
        owner: { id: userId, name: owner.name, email: owner.email },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    throw err;
  }
});

async function getProjectWithAccess(
  projectId: string,
  userId: string,
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
  return shareResult.Item ? project : null;
}

// GET /api/projects/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const project = await getProjectWithAccess(req.params.id, req.user!.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const [layoutsResult, sharesResult] = await Promise.all([
    dynamo.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': `PROJECT#${req.params.id}` },
    })),
    dynamo.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI2',
      KeyConditionExpression: 'gsi2pk = :pk',
      ExpressionAttributeValues: { ':pk': `PROJSHARES#${req.params.id}` },
    })),
  ]);

  const layouts = (layoutsResult.Items || []).sort(
    (a: Record<string, unknown>, b: Record<string, unknown>) => (b.version as number) - (a.version as number),
  );

  const shareItems = sharesResult.Items || [];
  let shares: unknown[] = [];
  if (shareItems.length > 0) {
    const batchResult = await dynamo.send(new BatchGetCommand({
      RequestItems: {
        [TABLE]: {
          Keys: shareItems.map((s: Record<string, unknown>) => ({ pk: `USER#${s.userId}`, sk: `USER#${s.userId}` })),
        },
      },
    }));
    const userMap = new Map(
      (batchResult.Responses?.[TABLE] || []).map((u: Record<string, unknown>) => [u.id as string, u]),
    );
    shares = shareItems.map((s: Record<string, unknown>) => ({
      ...s,
      user: {
        id: s.userId,
        name: (userMap.get(s.userId as string) as Record<string, unknown> | undefined)?.name,
        email: (userMap.get(s.userId as string) as Record<string, unknown> | undefined)?.email,
      },
    }));
  }

  res.json({
    project: {
      ...project,
      owner: { id: project.ownerId, name: project.ownerName, email: project.ownerEmail },
      layouts,
      shares,
    },
  });
});

// PUT /api/projects/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = projectSchema.partial().parse(req.body);
    const existing = await dynamo.send(new GetCommand({
      TableName: TABLE,
      Key: { pk: `PROJECT#${req.params.id}`, sk: `PROJECT#${req.params.id}` },
    }));
    const project = existing.Item;
    if (!project || project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'Project not found or no permission' });
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.venueWidth !== undefined) updates.venueWidth = data.venueWidth;
    if (data.venueHeight !== undefined) updates.venueHeight = data.venueHeight;
    if (data.eventDate !== undefined) updates.eventDate = data.eventDate;

    const setExpr = Object.keys(updates).map(k => `#${k} = :${k}`).join(', ');
    const exprNames = Object.fromEntries(Object.keys(updates).map(k => [`#${k}`, k]));
    const exprValues = Object.fromEntries(Object.keys(updates).map(k => [`:${k}`, updates[k]]));

    const result = await dynamo.send(new UpdateCommand({
      TableName: TABLE,
      Key: { pk: `PROJECT#${req.params.id}`, sk: `PROJECT#${req.params.id}` },
      UpdateExpression: `SET ${setExpr}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ReturnValues: 'ALL_NEW',
    }));

    res.json({ project: result.Attributes });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    throw err;
  }
});

// DELETE /api/projects/:id  (cascades layouts and shares)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await dynamo.send(new GetCommand({
    TableName: TABLE,
    Key: { pk: `PROJECT#${req.params.id}`, sk: `PROJECT#${req.params.id}` },
  }));
  const project = existing.Item;
  if (!project || project.ownerId !== req.user!.id) {
    return res.status(404).json({ error: 'Project not found or no permission' });
  }

  const [layoutsResult, sharesResult] = await Promise.all([
    dynamo.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': `PROJECT#${req.params.id}` },
    })),
    dynamo.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI2',
      KeyConditionExpression: 'gsi2pk = :pk',
      ExpressionAttributeValues: { ':pk': `PROJSHARES#${req.params.id}` },
    })),
  ]);

  // Delete layouts (and their S3 objects)
  await Promise.all(
    (layoutsResult.Items || []).map(async (layout: Record<string, unknown>) => {
      if (layout.s3Key) await deleteLayoutJson(layout.s3Key as string);
      return dynamo.send(new DeleteCommand({
        TableName: TABLE,
        Key: { pk: `LAYOUT#${layout.id}`, sk: `LAYOUT#${layout.id}` },
      }));
    }),
  );

  // Delete shares
  await Promise.all(
    (sharesResult.Items || []).map((share: Record<string, unknown>) =>
      dynamo.send(new DeleteCommand({
        TableName: TABLE,
        Key: {
          pk: `PROJECT#${share.projectId}#SHARE#${share.userId}`,
          sk: `PROJECT#${share.projectId}#SHARE#${share.userId}`,
        },
      })),
    ),
  );

  await dynamo.send(new DeleteCommand({
    TableName: TABLE,
    Key: { pk: `PROJECT#${req.params.id}`, sk: `PROJECT#${req.params.id}` },
  }));

  res.json({ message: 'Project deleted' });
});

export default router;
