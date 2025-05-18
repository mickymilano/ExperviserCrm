import type { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../postgresStorage';

const createSubSectorSchema = z.object({
  sectorId: z.number(),
  name: z.string(),
});
export async function getSubSectors(req: Request, res: Response) {
  const { sectorId, search } = req.query;
  const list = await storage.getSubSectors({
    sectorId: Number(sectorId),
    search: String(search ?? ''),
  });
  res.json(list);
}
export async function createSubSector(req: Request, res: Response) {
  const dto = createSubSectorSchema.parse(req.body);
  const item = await storage.createSubSector(dto);
  res.status(201).json(item);
}