import { Router } from 'express';
import { getAsignaciones, asignarEvaluador, asignarEvaluadorMasivo, desasignarEvaluador, toggleJurisdiccionEvaluador } from '../controllers/evaluadores.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/asignaciones', requireRole(['ADMIN', 'EVALUADOR']), getAsignaciones);

router.use(requireRole(['ADMIN']));
router.post('/asignaciones', asignarEvaluador);
router.post('/asignaciones/masivo', asignarEvaluadorMasivo);
router.post('/jurisdiccion', toggleJurisdiccionEvaluador);
router.delete('/asignaciones/:id', desasignarEvaluador);

export default router;
