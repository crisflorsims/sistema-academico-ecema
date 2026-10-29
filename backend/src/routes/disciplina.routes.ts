import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { 
  registrarDemerito, 
  getDisciplinaByInscripcion, 
  getAlertas, 
  getHistorial, 
  updateDemerito, 
  deleteDemerito,
  verificarAntecedente 
} from '../controllers/disciplina.controller.js';

const router = Router();

router.use(authenticateToken);

// Solo ADMIN e INSTRUCCION pueden registrar demeritos y ver alertas
router.post('/demerito', requireRole(['ADMIN', 'INSTRUCCION']), registrarDemerito);
router.put('/demerito/:id', requireRole(['ADMIN', 'INSTRUCCION']), updateDemerito);
router.delete('/demerito/:id', requireRole(['ADMIN', 'INSTRUCCION']), deleteDemerito);
router.get('/alertas', requireRole(['ADMIN', 'INSTRUCCION']), getAlertas);
router.get('/historial', requireRole(['ADMIN', 'INSTRUCCION']), getHistorial);
router.get('/verificar-antecedente', requireRole(['ADMIN', 'INSTRUCCION']), verificarAntecedente);

// Todos los autenticados pueden ver la disciplina de una inscripción (para el estudiante mismo)
router.get('/inscripcion/:id', getDisciplinaByInscripcion);

export default router;
