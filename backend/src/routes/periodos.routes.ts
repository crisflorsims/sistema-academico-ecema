import { Router } from 'express';
import { getPeriodos, createPeriodo, deletePeriodo, updatePeriodo } from '../controllers/periodos.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren rol ADMIN
router.use(authenticateToken, requireRole(['ADMIN']));

router.get('/', getPeriodos);
router.post('/', createPeriodo);
router.put('/:id', updatePeriodo);
router.delete('/:id', deletePeriodo);

export default router;
