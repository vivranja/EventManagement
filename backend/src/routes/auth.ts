import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamo, TABLE } from '../lib/dynamo';

const router = Router();

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'PLANNER', 'CLIENT']).optional().default('PLANNER'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function findUserByEmail(email: string) {
  const result = await dynamo.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression: 'gsi1pk = :pk',
    ExpressionAttributeValues: { ':pk': `EMAIL#${email}` },
    Limit: 1,
  }));
  return result.Items?.[0];
}

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const data = signupSchema.parse(req.body);
    const existing = await findUserByEmail(data.email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const id = uuidv4();
    const now = new Date().toISOString();
    const hashed = await bcrypt.hash(data.password, 12);

    await dynamo.send(new PutCommand({
      TableName: TABLE,
      Item: {
        pk: `USER#${id}`,
        sk: `USER#${id}`,
        gsi1pk: `EMAIL#${data.email}`,
        gsi1sk: `USER#${id}`,
        type: 'USER',
        id,
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role,
        createdAt: now,
        updatedAt: now,
      },
    }));

    const token = jwt.sign(
      { id, email: data.email, role: data.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      user: { id, name: data.name, email: data.email, role: data.role, createdAt: now },
      token,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    throw err;
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await findUserByEmail(data.email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(data.password, user.password as string);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    throw err;
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const result = await dynamo.send(new GetCommand({
      TableName: TABLE,
      Key: { pk: `USER#${decoded.id}`, sk: `USER#${decoded.id}` },
    }));
    const user = result.Item;
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
