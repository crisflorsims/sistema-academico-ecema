import { Router } from 'express';
import { login, register, getPerfil, updatePerfil } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', authenticateToken, getPerfil);
router.put('/me', authenticateToken, updatePerfil);

export default router;
