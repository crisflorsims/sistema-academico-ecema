import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';
import { eventosService } from '../services/eventos.service.js';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        grado: true,
        ci: true,
        cm: true,
        promocion: true,
        rol: true,
        activo: true,
        motivo_inactivacion: true,
        intentos_fallidos: true,
        bloqueado_hasta: true,
        telefono: true,
        creado_en: true,
        inscripciones: {
          select: {
            id: true,
            estado: true,
            fecha_inscripcion: true,
            edicion: {
              select: {
                id: true,
                estado: true,
                diplomado: { select: { id: true, nombre: true } },
                periodo: { select: { gestion: true, semestre: true } }
              }
            }
          },
          orderBy: { fecha_inscripcion: 'desc' }
        },
        materias_asignadas: {
          select: {
            materia: { select: { id: true, nombre: true } }
          }
        },
        materias_evaluadas: {
          select: {
            materia: { select: { id: true, nombre: true } }
          }
        }
      },
      orderBy: { creado_en: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, apellido, email, password, rol, telefono, grado, ci, cm, promocion } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Navegador Web';
    const adminId = (req as any).user?.userId || null;

    if (!nombre || !apellido || !email || !password) {
      res.status(400).json({ error: 'Nombre, apellido, correo y contraseña son obligatorios' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener un mínimo de 6 caracteres por seguridad institucional' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCi = ci ? ci.toString().trim() : null;
    const cleanCm = cm ? cm.toString().trim() : null;

    // 1. Verificación de unicidad de Email
    const existingEmail = await prisma.usuario.findUnique({ where: { email: cleanEmail } });
    if (existingEmail) {
      res.status(400).json({ error: `El correo electrónico "${cleanEmail}" ya está registrado en el sistema` });
      return;
    }

    // 2. Verificación de unicidad de CI (Identidad Militar/Civil)
    if (cleanCi) {
      const existingCi = await prisma.usuario.findFirst({ where: { ci: cleanCi } });
      if (existingCi) {
        res.status(400).json({
          error: `El Carnet de Identidad (CI: ${cleanCi}) ya pertenece a ${existingCi.grado ? existingCi.grado + ' ' : ''}${existingCi.nombre} ${existingCi.apellido}`
        });
        return;
      }
    }

    // 3. Verificación de unicidad de Carnet Militar (CM)
    if (cleanCm) {
      const existingCm = await prisma.usuario.findFirst({ where: { cm: cleanCm } });
      if (existingCm) {
        res.status(400).json({
          error: `El Carnet Militar (CM: ${cleanCm}) ya pertenece a ${existingCm.grado ? existingCm.grado + ' ' : ''}${existingCm.nombre} ${existingCm.apellido}`
        });
        return;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: cleanEmail,
        password_hash: hashedPassword,
        rol: rol || 'CURSANTE',
        telefono: telefono ? telefono.toString().trim() : null,
        grado: grado ? grado.toString().trim() : null,
        ci: cleanCi,
        cm: cleanCm,
        promocion: promocion ? promocion.toString().trim() : null,
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        grado: true,
        ci: true,
        cm: true,
        promocion: true,
        activo: true
      }
    });
    
    // Registrar evento de auditoría
    await eventosService.registrarEvento(
      adminId,
      'CREAR',
      'USUARIO',
      {
        detalles: `Alta de usuario: ${user.grado ? user.grado + ' ' : ''}${user.nombre} ${user.apellido} (${user.email}) con rol [${user.rol}]`,
        severidad: user.rol === 'ADMIN' ? 'ALTA' : 'MEDIA',
        ip: clientIp,
        dispositivo: userAgent,
        objeto_afectado: user.email,
        valor_nuevo: { id: user.id, rol: user.rol, ci: user.ci, cm: user.cm }
      }
    );

    res.status(201).json(user);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { activo, motivo_inactivacion } = req.body;
    const targetId = parseInt(id as string);
    const adminId = (req as any).user?.userId || null;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Navegador Web';

    const targetUser = await prisma.usuario.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Blindaje: El admin no puede desactivarse a sí mismo
    if (adminId === targetId && activo === false) {
      res.status(400).json({ error: 'Operación denegada: No puedes desactivar o dar de baja tu propia cuenta de Administrador' });
      return;
    }

    // Blindaje de cuenta raíz
    if (targetUser.email === 'admin@ecema.edu' && activo === false) {
      res.status(400).json({ error: 'Operación denegada: La cuenta maestra admin@ecema.edu no puede ser desactivada' });
      return;
    }

    const user = await prisma.usuario.update({
      where: { id: targetId },
      data: {
        activo: !!activo,
        motivo_inactivacion: activo ? null : (motivo_inactivacion || 'Baja administrativa institucional'),
        // Si se reactiva, resetear contadores de bloqueo
        intentos_fallidos: activo ? 0 : targetUser.intentos_fallidos,
        bloqueado_hasta: activo ? null : targetUser.bloqueado_hasta
      },
      select: { id: true, email: true, activo: true, motivo_inactivacion: true }
    });

    await eventosService.registrarEvento(
      adminId,
      activo ? 'REACTIVAR' : 'BAJA',
      'USUARIO',
      {
        detalles: activo
          ? `Reactivación de cuenta: ${targetUser.nombre} ${targetUser.apellido} (${targetUser.email})`
          : `Baja Institucional aplicada a ${targetUser.nombre} ${targetUser.apellido} (${targetUser.email}). Motivo: ${motivo_inactivacion || 'Baja administrativa'}`,
        severidad: 'ALTA',
        ip: clientIp,
        dispositivo: userAgent,
        objeto_afectado: targetUser.email,
        valor_anterior: { activo: targetUser.activo },
        valor_nuevo: { activo: user.activo, motivo: user.motivo_inactivacion }
      }
    );
    
    res.json(user);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al actualizar estado del usuario' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id as string);
    const { nombre, apellido, email, password, rol, telefono, grado, ci, cm, promocion } = req.body;
    const adminId = (req as any).user?.userId || null;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Navegador Web';

    const prevUser = await prisma.usuario.findUnique({ where: { id: targetId } });
    if (!prevUser) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // 1. Blindaje de Auto-Despojo: No permitir que el propio admin se quite el rol ADMIN
    if (adminId === targetId && rol && rol !== 'ADMIN') {
      res.status(400).json({ error: 'Seguridad institucional: No puedes quitarte a ti mismo el rol de Administrador' });
      return;
    }

    const cleanEmail = email ? email.trim().toLowerCase() : prevUser.email;
    const cleanCi = ci !== undefined ? (ci ? ci.toString().trim() : null) : prevUser.ci;
    const cleanCm = cm !== undefined ? (cm ? cm.toString().trim() : null) : prevUser.cm;

    // 2. Unicidad de Email
    if (cleanEmail !== prevUser.email) {
      const existingEmail = await prisma.usuario.findUnique({ where: { email: cleanEmail } });
      if (existingEmail && existingEmail.id !== targetId) {
        res.status(400).json({ error: `El correo "${cleanEmail}" ya está en uso por otro usuario` });
        return;
      }
    }

    // 3. Unicidad de CI
    if (cleanCi && cleanCi !== prevUser.ci) {
      const existingCi = await prisma.usuario.findFirst({
        where: { ci: cleanCi, NOT: { id: targetId } }
      });
      if (existingCi) {
        res.status(400).json({
          error: `El CI "${cleanCi}" ya pertenece a otro usuario (${existingCi.grado ? existingCi.grado + ' ' : ''}${existingCi.nombre} ${existingCi.apellido})`
        });
        return;
      }
    }

    // 4. Unicidad de CM
    if (cleanCm && cleanCm !== prevUser.cm) {
      const existingCm = await prisma.usuario.findFirst({
        where: { cm: cleanCm, NOT: { id: targetId } }
      });
      if (existingCm) {
        res.status(400).json({
          error: `El Carnet Militar "${cleanCm}" ya pertenece a otro usuario (${existingCm.grado ? existingCm.grado + ' ' : ''}${existingCm.nombre} ${existingCm.apellido})`
        });
        return;
      }
    }

    const dataToUpdate: any = {
      nombre: nombre ? nombre.trim() : prevUser.nombre,
      apellido: apellido ? apellido.trim() : prevUser.apellido,
      email: cleanEmail,
      rol: rol || prevUser.rol,
      telefono: telefono !== undefined ? (telefono ? telefono.toString().trim() : null) : prevUser.telefono,
      grado: grado !== undefined ? (grado ? grado.toString().trim() : null) : prevUser.grado,
      ci: cleanCi,
      cm: cleanCm,
      promocion: promocion !== undefined ? (promocion ? promocion.toString().trim() : null) : prevUser.promocion
    };
    
    // Si se envía contraseña, validar longitud mínima
    let passwordChanged = false;
    if (password && password.trim() !== '') {
      if (password.trim().length < 6) {
        res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
        return;
      }
      dataToUpdate.password_hash = await bcrypt.hash(password.trim(), 10);
      dataToUpdate.intentos_fallidos = 0;
      dataToUpdate.bloqueado_hasta = null;
      passwordChanged = true;
    }

    const updatedUser = await prisma.usuario.update({
      where: { id: targetId },
      data: dataToUpdate,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        grado: true,
        ci: true,
        cm: true,
        promocion: true,
        activo: true
      }
    });

    // 5. Auditoría Forense con Detección de Cambios (Diff)
    const cambios: string[] = [];
    if (prevUser.rol !== updatedUser.rol) cambios.push(`Rol: ${prevUser.rol} -> ${updatedUser.rol}`);
    if (prevUser.email !== updatedUser.email) cambios.push(`Email: ${prevUser.email} -> ${updatedUser.email}`);
    if ((prevUser.ci || '') !== (updatedUser.ci || '')) cambios.push(`CI: ${prevUser.ci || 'S/N'} -> ${updatedUser.ci || 'S/N'}`);
    if ((prevUser.cm || '') !== (updatedUser.cm || '')) cambios.push(`CM: ${prevUser.cm || 'S/N'} -> ${updatedUser.cm || 'S/N'}`);
    if ((prevUser.grado || '') !== (updatedUser.grado || '')) cambios.push(`Grado: ${prevUser.grado || '-'} -> ${updatedUser.grado || '-'}`);
    if (passwordChanged) cambios.push('Contraseña restablecida por administrador');

    if (cambios.length > 0) {
      const esCambioPrivilegio = prevUser.rol !== updatedUser.rol;
      await eventosService.registrarEvento(
        adminId,
        'EDITAR',
        'USUARIO',
        {
          detalles: `Modificación de usuario [${updatedUser.grado ? updatedUser.grado + ' ' : ''}${updatedUser.nombre} ${updatedUser.apellido}]: ${cambios.join(' | ')}`,
          severidad: esCambioPrivilegio ? 'CRITICA' : 'MEDIA',
          ip: clientIp,
          dispositivo: userAgent,
          objeto_afectado: updatedUser.email,
          valor_anterior: { rol: prevUser.rol, email: prevUser.email, ci: prevUser.ci },
          valor_nuevo: { rol: updatedUser.rol, email: updatedUser.email, ci: updatedUser.ci }
        }
      );
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al editar usuario' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id as string);
    const adminId = (req as any).user?.userId || null;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Navegador Web';

    const targetUser = await prisma.usuario.findUnique({
      where: { id: targetId },
      include: {
        _count: {
          select: {
            inscripciones: true,
            materias_asignadas: true,
            materias_evaluadas: true,
            calificaciones_dadas: true,
            demeritos_reportados: true,
            notas_auditadas: true
          }
        }
      }
    });

    if (!targetUser) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Blindaje de Auto-eliminación
    if (adminId === targetId) {
      res.status(400).json({ error: 'Seguridad institucional: No puedes eliminar tu propia cuenta de Administrador' });
      return;
    }

    // Blindaje de cuenta maestra
    if (targetUser.email === 'admin@ecema.edu') {
      res.status(400).json({ error: 'Seguridad institucional: La cuenta maestra admin@ecema.edu no puede ser eliminada' });
      return;
    }

    const totalHistorial = 
      targetUser._count.inscripciones +
      targetUser._count.materias_asignadas +
      targetUser._count.materias_evaluadas +
      targetUser._count.calificaciones_dadas +
      targetUser._count.demeritos_reportados +
      targetUser._count.notas_auditadas;

    // SI TIENE HISTORIAL ACADÉMICO / MILITAR: APLICAR BAJA INSTITUCIONAL (SOFT DELETE)
    if (totalHistorial > 0) {
      await prisma.usuario.update({
        where: { id: targetId },
        data: {
          activo: false,
          motivo_inactivacion: 'Baja Institucional automática para preservar registros históricos'
        }
      });

      await eventosService.registrarEvento(
        adminId,
        'BAJA',
        'USUARIO',
        {
          detalles: `Baja Institucional preventiva aplicada a ${targetUser.grado ? targetUser.grado + ' ' : ''}${targetUser.nombre} ${targetUser.apellido} (${targetUser.email}). Se resguardaron ${totalHistorial} registros históricos vinculados.`,
          severidad: 'ALTA',
          ip: clientIp,
          dispositivo: userAgent,
          objeto_afectado: targetUser.email,
          metadata: { totalHistorial, detalleCounts: targetUser._count }
        }
      );

      res.json({
        message: 'El usuario cuenta con historial académico/militar activo. Se aplicó Baja Institucional (Inactivación) para garantizar la integridad histórica y legal de las actas.',
        softDeleted: true
      });
      return;
    }

    // SI NO TIENE NINGÚN HISTORIAL: SE PUEDE ELIMINAR FÍSICAMENTE
    await prisma.usuario.delete({
      where: { id: targetId }
    });

    await eventosService.registrarEvento(
      adminId,
      'ELIMINAR',
      'USUARIO',
      {
        detalles: `Eliminación física definitiva de cuenta sin registros: ${targetUser.nombre} ${targetUser.apellido} (${targetUser.email})`,
        severidad: 'CRITICA',
        ip: clientIp,
        dispositivo: userAgent,
        objeto_afectado: targetUser.email
      }
    );

    res.json({ message: 'Usuario sin historial eliminado exitosamente de la base de datos', softDeleted: false });
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al procesar la baja/eliminación del usuario' });
  }
};

export const desbloquearUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id as string);
    const adminId = (req as any).user?.userId || null;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Navegador Web';

    const targetUser = await prisma.usuario.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    await prisma.usuario.update({
      where: { id: targetId },
      data: {
        intentos_fallidos: 0,
        bloqueado_hasta: null
      }
    });

    await eventosService.registrarEvento(
      adminId,
      'DESBLOQUEO',
      'SEGURIDAD',
      {
        detalles: `Desbloqueo administrativo de cuenta por fuerza bruta: ${targetUser.email}`,
        severidad: 'MEDIA',
        ip: clientIp,
        dispositivo: userAgent,
        objeto_afectado: targetUser.email
      }
    );

    res.json({ message: `Cuenta de ${targetUser.nombre} ${targetUser.apellido} desbloqueada exitosamente` });
  } catch (error) {
    console.error('[Error en desbloquearUsuario]:', error);
    res.status(500).json({ error: 'Error al desbloquear la cuenta' });
  }
};

export const getUserNotas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const inscripciones = await prisma.inscripcion.findMany({
      where: { cursante_id: parseInt(id as string) },
      include: {
        edicion: {
          include: {
            diplomado: true,
            periodo: true
          }
        },
        materias: {
          include: {
            materia: {
              include: { area: true }
            },
            calificaciones: true
          }
        }
      },
      orderBy: { fecha_inscripcion: 'desc' }
    });

    res.json(inscripciones);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al obtener las notas del usuario' });
  }
};

export const importarUsuariosExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { usuarios: filas } = req.body;
    const adminId = (req as any).user?.userId || null;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Navegador Web';

    if (!Array.isArray(filas) || filas.length === 0) {
      res.status(400).json({ error: 'No se enviaron usuarios para importar' });
      return;
    }

    const creados: any[] = [];
    const omitidos: any[] = [];

    for (let i = 0; i < filas.length; i++) {
      const row = filas[i];
      const nombre = (row.nombre || '').toString().trim();
      const apellido = (row.apellido || '').toString().trim();
      const ci = row.ci ? row.ci.toString().trim() : null;
      const cm = row.cm ? row.cm.toString().trim() : null;
      let email = row.email ? row.email.toString().trim().toLowerCase() : null;
      const grado = row.grado ? row.grado.toString().trim() : null;
      const promocion = row.promocion ? row.promocion.toString().trim() : null;
      const telefono = row.telefono ? row.telefono.toString().trim() : null;
      const rolRaw = (row.rol || 'CURSANTE').toString().trim().toUpperCase();
      
      const rolesValidos = ['ADMIN', 'DOCENTE', 'CURSANTE', 'EVALUADOR', 'INSTRUCCION'];
      const rol = rolesValidos.includes(rolRaw) ? rolRaw : 'CURSANTE';

      if (!nombre && !apellido && !ci) {
        omitidos.push({ fila: i + 1, razon: 'Fila incompleta sin nombre ni CI', ci });
        continue;
      }

      // Comprobar si ya existe por CI, CM o Email
      let existingUser = null;
      if (ci) existingUser = await prisma.usuario.findFirst({ where: { ci } });
      if (!existingUser && cm) existingUser = await prisma.usuario.findFirst({ where: { cm } });
      if (!existingUser && email) existingUser = await prisma.usuario.findUnique({ where: { email } });

      if (existingUser) {
        omitidos.push({
          fila: i + 1,
          razon: 'Usuario ya registrado previamente (coincidencia de CI, CM o correo)',
          nombre: `${existingUser.grado || ''} ${existingUser.nombre} ${existingUser.apellido}`.trim(),
          ci: existingUser.ci
        });
        continue;
      }

      // Si no tiene email, autogenerar
      if (!email) {
        const cleanCi = ci ? ci.replace(/[^a-zA-Z0-9]/g, '') : '';
        const cleanNom = nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanApe = apellido.toLowerCase().replace(/[^a-z0-9]/g, '');
        email = cleanCi ? `${cleanCi}@sistema.mil.bo` : `${cleanNom}.${cleanApe}@sistema.mil.bo`;
      }

      let finalEmail = email;
      let emailCounter = 1;
      while (await prisma.usuario.findUnique({ where: { email: finalEmail } })) {
        const [prefix, domain] = email.split('@');
        finalEmail = `${prefix}${emailCounter}@${domain || 'sistema.mil.bo'}`;
        emailCounter++;
      }

      // Clave inicial segura
      const initialPass = ci && ci.length >= 6 ? ci : (ci ? `${ci}.2026` : 'Ecema.2026');
      const hashedPassword = await bcrypt.hash(initialPass, 10);

      const nuevoUsuario = await prisma.usuario.create({
        data: {
          nombre: nombre || 'Usuario',
          apellido: apellido || 'Sin Apellido',
          email: finalEmail,
          password_hash: hashedPassword,
          grado,
          ci,
          cm,
          telefono,
          promocion,
          // @ts-ignore
          rol,
          activo: true
        },
        select: { id: true, nombre: true, apellido: true, email: true, rol: true, grado: true, ci: true, cm: true }
      });

      creados.push(nuevoUsuario);
    }

    await eventosService.registrarEvento(
      adminId,
      'IMPORTAR',
      'USUARIO',
      {
        detalles: `Importación masiva Excel: ${creados.length} usuarios dados de alta (${omitidos.length} omitidos por unicidad de CI/CM/Email).`,
        severidad: 'MEDIA',
        ip: clientIp,
        dispositivo: userAgent,
        metadata: { totalFilas: filas.length, creados: creados.length, omitidos: omitidos.length }
      }
    );

    res.status(201).json({
      message: `Se crearon ${creados.length} usuarios exitosamente (${omitidos.length} omitidos por ya estar registrados).`,
      totalProcesados: filas.length,
      creados: creados.length,
      omitidos: omitidos.length,
      detalles: { creados, omitidos }
    });
  } catch (error) {
    console.error('[Error en importarUsuariosExcel]:', error);
    res.status(500).json({ error: 'Error al procesar el archivo de usuarios' });
  }
};
