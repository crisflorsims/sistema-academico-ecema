import { Router } from 'express';
import { getMisNotas } from '../controllers/estudiantes.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateToken, requireRole(['CURSANTE']));

router.get('/mis-notas', getMisNotas);

export default router;
