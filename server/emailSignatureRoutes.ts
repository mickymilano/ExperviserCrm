import express from 'express';
import { 
  getEmailSignatures, 
  createEmailSignature 
} from './controllers/emailController';

const router = express.Router();

// Gestione firme email
router.get('/', getEmailSignatures);
router.post('/', createEmailSignature);

export default router;