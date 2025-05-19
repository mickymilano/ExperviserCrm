import express from 'express';
import { emailSignatureController } from './controllers/fixedEmailSignatureController';
// Non importiamo authenticateJWT da routes per evitare dipendenze circolari
// Useremo l'authenticate standard che sarà già applicato nel file routes.ts

const router = express.Router();

// Rotte per le firme email
// Ora utilizziamo il percorso '/api/email-signatures' separato da email
router.get('/', emailSignatureController.getEmailSignatures);
router.get('/default', emailSignatureController.getDefaultSignature);
router.get('/:id', emailSignatureController.getEmailSignatureById);
router.post('/', emailSignatureController.createEmailSignature);
router.patch('/:id', emailSignatureController.updateEmailSignature);
router.delete('/:id', emailSignatureController.deleteEmailSignature);
router.patch('/:id/default', emailSignatureController.setDefaultSignature);

export default router;