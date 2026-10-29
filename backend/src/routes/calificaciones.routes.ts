import { Router } from 'express';
import { getDocenteMaterias, getCursantesMateria, registrarNota } from '../controllers/calificaciones.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas de calificaciones requieren autenticación
router.use(authenticateToken);

// Solo el rol DOCENTE y EVALUADOR puede gestionar estas rutas (aunque podríamos permitir al ADMIN también)
router.use(requireRole(['DOCENTE', 'EVALUADOR', 'ADMIN']));

router.get('/materias', getDocenteMaterias);
router.get('/materias/:materia_id/cursantes', getCursantesMateria);
router.post('/registrar', registrarNota);

export default router;
