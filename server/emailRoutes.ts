import express from 'express';
import {
  getEmailAccounts,
  createEmailAccount,
  updateEmailAccount,
  deleteEmailAccount,
  setPrimaryEmailAccount,
  getEmails,
  sendEmail,
  markEmailsAsRead,
  deleteEmails,
  generateAIReply,
  syncEmailAccounts
} from './controllers/emailController';

const router = express.Router();

// Gestione account email
router.get('/accounts', getEmailAccounts);
router.post('/accounts', createEmailAccount);
router.patch('/accounts/:id', updateEmailAccount);
router.delete('/accounts/:id', deleteEmailAccount);
router.post('/accounts/:id/primary', setPrimaryEmailAccount);

// Gestione email
router.get('/', getEmails);
router.post('/send', sendEmail);
router.post('/mark-read', markEmailsAsRead);
router.post('/delete', deleteEmails);
router.post('/ai-reply', generateAIReply);
router.post('/sync', syncEmailAccounts);

export default router;