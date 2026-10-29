import { Router } from 'express';
import { getAsignaciones, asignarDocente, desasignarDocente } from '../controllers/docentes.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateToken, requireRole(['ADMIN']));

router.get('/asignaciones', getAsignaciones);
router.post('/asignaciones', asignarDocente);
router.delete('/asignaciones/:id', desasignarDocente);

export default router;
