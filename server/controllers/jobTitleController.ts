import type { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';

const createJobTitleSchema = z.object({
  subSectorId: z.number(),
  name: z.string(),
});
export async function getJobTitles(req: Request, res: Response) {
  const { subSectorId, search } = req.query;
  const list = await storage.getJobTitles({
    subSectorId: Number(subSectorId),
    search: String(search ?? ''),
  });
  res.json(list);
}
export async function createJobTitle(req: Request, res: Response) {
  const dto = createJobTitleSchema.parse(req.body);
  const item = await storage.createJobTitle(dto);
  res.status(201).json(item);
}