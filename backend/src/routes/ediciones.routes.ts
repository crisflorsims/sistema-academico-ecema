import { Router } from 'express';
import { getEdiciones, createEdicion, updateEdicionEstado, updateEdicion, deleteEdicion } from '../controllers/ediciones.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateToken);

// Lectura de ediciones permitida para ADMIN, EVALUADOR e INSTRUCCION
router.get('/', requireRole(['ADMIN', 'EVALUADOR', 'INSTRUCCION']), getEdiciones);

// Mutaciones exclusivas para ADMIN
router.use(requireRole(['ADMIN']));
router.post('/', createEdicion);
router.put('/:id', updateEdicion);
router.patch('/:id/estado', updateEdicionEstado);
router.delete('/:id', deleteEdicion);

export default router;
