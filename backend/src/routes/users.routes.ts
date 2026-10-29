import { Router } from 'express';
import { 
  getUsers, 
  createUser, 
  importarUsuariosExcel,
  updateUserStatus, 
  updateUser, 
  deleteUser, 
  getUserNotas,
  desbloquearUsuario
} from '../controllers/users.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas de usuarios requieren rol ADMIN
router.use(authenticateToken, requireRole(['ADMIN']));

router.get('/', getUsers);
router.post('/importar-usuarios', importarUsuariosExcel);
router.post('/', createUser);
router.patch('/:id/status', updateUserStatus);
router.post('/:id/desbloquear', desbloquearUsuario);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.get('/:id/notas', getUserNotas);

export default router;
