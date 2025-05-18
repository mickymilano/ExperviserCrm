import express from 'express';
import { emailController } from './controllers/emailController';
import { authenticate } from './routes';

const router = express.Router();

// Account email routes
router.get('/accounts', authenticate, emailController.getEmailAccounts);
router.get('/accounts/:id', authenticate, emailController.getEmailAccountById);
router.post('/accounts', authenticate, emailController.createEmailAccount);
router.put('/accounts/:id', authenticate, emailController.updateEmailAccount);
router.delete('/accounts/:id', authenticate, emailController.deleteEmailAccount);
router.post('/accounts/:id/test', authenticate, emailController.testEmailConnection);
router.post('/accounts/:id/sync', authenticate, emailController.syncEmailAccount);

// Email messages routes
router.get('/accounts/:id/messages', authenticate, emailController.getEmailsByAccount);
router.get('/messages/:id', authenticate, emailController.getEmailById);
router.post('/send', authenticate, emailController.sendEmail);

export default router;