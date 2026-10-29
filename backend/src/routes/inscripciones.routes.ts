import { Router } from 'express';
import { 
  getInscripciones, 
  getMisInscripciones, 
  createInscripcion, 
  importarNominaExcel,
  updateInscripcionEstado, 
  updateInscripcion, 
  deleteInscripcion, 
  updatePonderaciones 
} from '../controllers/inscripciones.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Asegurar autenticación en todas las rutas
router.use(authenticateToken);

// Ruta para que el cursante vea sus propias inscripciones
router.get('/mis-inscripciones', getMisInscripciones);

// Rutas de lectura y actualización compartidas para ADMIN y EVALUADOR
router.get('/', requireRole(['ADMIN', 'EVALUADOR', 'INSTRUCCION']), getInscripciones);
router.put('/:id/ponderaciones', requireRole(['ADMIN', 'EVALUADOR']), updatePonderaciones);

// Rutas de mutación exclusivas para ADMIN
router.use(requireRole(['ADMIN']));
router.post('/importar-nomina', importarNominaExcel);
router.post('/', createInscripcion);
router.patch('/:id/estado', updateInscripcionEstado);
router.put('/:id', updateInscripcion);
router.delete('/:id', deleteInscripcion);
export default router;
