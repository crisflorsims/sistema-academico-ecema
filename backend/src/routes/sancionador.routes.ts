import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import * as sancionadorController from '../controllers/sancionador.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', sancionadorController.getSancionadores);
router.post('/', requireRole(['ADMIN', 'INSTRUCCION']), sancionadorController.createSancionador);
router.put('/:id', requireRole(['ADMIN', 'INSTRUCCION']), sancionadorController.updateSancionador);
router.delete('/:id', requireRole(['ADMIN', 'INSTRUCCION']), sancionadorController.deleteSancionador);

export default router;
