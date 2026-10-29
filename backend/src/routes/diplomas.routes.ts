import { Router } from 'express';
import { getDiplomas, createDiplomado, createMateria, createArea, updateArea, updateMateria } from '../controllers/diplomas.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Todos los usuarios autenticados pueden ver diplomados (Por ahora lo dejamos público para probar)
router.get('/', getDiplomas);

// Solo ADMIN puede crear diplomados
router.post('/', authenticateToken, requireRole(['ADMIN']), createDiplomado);

// Solo ADMIN puede agregar/editar materias
router.post('/:diplomado_id/materias', authenticateToken, requireRole(['ADMIN']), createMateria);
router.put('/materias/:id', authenticateToken, requireRole(['ADMIN']), updateMateria);

// Solo ADMIN puede agregar/editar áreas
router.post('/:diplomado_id/areas', authenticateToken, requireRole(['ADMIN']), createArea);
router.put('/areas/:id', authenticateToken, requireRole(['ADMIN']), updateArea);

export default router;
