import express from 'express';
import { emailSignatureController } from './controllers/emailSignatureController';
// Non importiamo authenticateJWT da routes per evitare dipendenze circolari
// Useremo l'authenticate standard che sarà già applicato nel file routes.ts

const router = express.Router();

// Rotte per le firme email
router.get('/signatures', emailSignatureController.getEmailSignatures);
router.get('/signatures/:id', emailSignatureController.getEmailSignatureById);
router.post('/signatures', emailSignatureController.createEmailSignature);
router.patch('/signatures/:id', emailSignatureController.updateEmailSignature);
router.delete('/signatures/:id', emailSignatureController.deleteEmailSignature);
router.patch('/signatures/:id/default', emailSignatureController.setDefaultSignature);
router.get('/signatures/default', emailSignatureController.getDefaultSignature);

export default router;