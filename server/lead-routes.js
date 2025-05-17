import { Router } from 'express';
import * as leadController from './controllers/leadController.js';
import { authenticate } from './auth.js';

const router = Router();

// Lead CRUD + conversion
router.get('/api/leads', authenticate, leadController.listLeads);
router.get('/api/leads/:id', authenticate, leadController.getLead);
router.post('/api/leads', authenticate, leadController.createLead);
router.patch('/api/leads/:id', authenticate, leadController.updateLead);
router.delete('/api/leads/:id', authenticate, leadController.deleteLead);
router.post('/api/leads/:id/convert', authenticate, leadController.convertLead);

export default router;
