import type { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../postgresStorage';

const createSectorSchema = z.object({ name: z.string() });
export async function getSectors(_req: Request, res: Response) {
  const list = await storage.getSectors();
  res.json(list);
}
export async function createSector(req: Request, res: Response) {
  const { name } = createSectorSchema.parse(req.body);
  const item = await storage.createSector({ name });
  res.status(201).json(item);
}