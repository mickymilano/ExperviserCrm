import express from 'express';
import { emailController } from './controllers/emailController';

const router = express.Router();

// Account email routes
router.get('/accounts', emailController.getEmailAccounts);
router.get('/accounts/:id', emailController.getEmailAccountById);
router.post('/accounts', emailController.createEmailAccount);
router.put('/accounts/:id', emailController.updateEmailAccount);
router.delete('/accounts/:id', emailController.deleteEmailAccount);
router.post('/accounts/:id/test', emailController.testEmailConnection);
router.post('/accounts/:id/sync', emailController.syncEmailAccount);

// Email messages routes
router.get('/accounts/:id/messages', emailController.getEmailsByAccount);
router.get('/messages/:id', emailController.getEmailById);
router.post('/send', emailController.sendEmail);

// Email signatures routes
router.get('/signatures', emailController.getEmailSignatures);
router.get('/signatures/:id', emailController.getEmailSignatureById);
router.post('/signatures', emailController.createEmailSignature);
router.put('/signatures/:id', emailController.updateEmailSignature);
router.delete('/signatures/:id', emailController.deleteEmailSignature);
router.post('/signatures/:id/default', emailController.setDefaultSignature);

// Email account signatures association routes
router.get('/accounts/:accountId/signatures', emailController.getEmailAccountSignatures);
router.post('/accounts/:accountId/signatures/:signatureId', emailController.addSignatureToAccount);
router.delete('/accounts/:accountId/signatures/:signatureId', emailController.removeSignatureFromAccount);
router.post('/accounts/:accountId/signatures/:signatureId/default', emailController.setDefaultSignatureForAccount);

export default router;