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

export default router;