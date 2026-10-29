import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { eventosService } from '../services/eventos.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, apellido, email, password, rol } = req.body;

    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'El usuario ya existe' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        password_hash: hashedPassword,
        rol: rol || 'CURSANTE',
      },
    });

    res.status(201).json({ message: 'Usuario creado exitosamente', user: { id: user.id, email: user.email, rol: user.rol } });
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error registrando usuario' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Navegador Web';

    if (!email || !password) {
      res.status(400).json({ error: 'Debes proporcionar correo electrónico y contraseña' });
      return;
    }

    const user = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // 1. Verificación de cuenta activa (Baja Institucional / Inactivación)
    if (!user.activo) {
      await eventosService.registrarEvento(
        user.id,
        'LOGIN_RECHAZADO',
        'SEGURIDAD',
        {
          detalles: `Intento de acceso bloqueado: cuenta dada de baja o inactiva${user.motivo_inactivacion ? ' (' + user.motivo_inactivacion + ')' : ''}`,
          severidad: 'ALTA',
          ip: clientIp,
          dispositivo: userAgent,
          objeto_afectado: user.email
        }
      );
      res.status(403).json({
        error: `Acceso restringido: Esta cuenta se encuentra dada de baja o suspendida.${user.motivo_inactivacion ? ' Motivo: ' + user.motivo_inactivacion : ' Contacta a la administración de la ECEMA.'}`
      });
      return;
    }

    // 2. Verificación de bloqueo temporal por fuerza bruta
    if (user.bloqueado_hasta && user.bloqueado_hasta > new Date()) {
      const minutosRestantes = Math.ceil((user.bloqueado_hasta.getTime() - Date.now()) / (1000 * 60));
      await eventosService.registrarEvento(
        user.id,
        'LOGIN_BLOQUEADO',
        'SEGURIDAD',
        {
          detalles: `Intento de acceso a cuenta temporalmente bloqueada. Minutos restantes: ${minutosRestantes}`,
          severidad: 'ALTA',
          ip: clientIp,
          dispositivo: userAgent,
          objeto_afectado: user.email
        }
      );
      res.status(429).json({
        error: `Cuenta temporalmente bloqueada por superar intentos de contraseña. Intenta nuevamente en ${minutosRestantes} minuto(s).`
      });
      return;
    }

    // 3. Validación de contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const MAX_INTENTOS = 5;
      const nuevosIntentos = (user.intentos_fallidos || 0) + 1;
      const bloquear = nuevosIntentos >= MAX_INTENTOS;
      const bloqueadoHasta = bloquear ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.usuario.update({
        where: { id: user.id },
        data: {
          intentos_fallidos: bloquear ? 0 : nuevosIntentos,
          bloqueado_hasta: bloqueadoHasta
        }
      });

      await eventosService.registrarEvento(
        user.id,
        bloquear ? 'CUENTA_BLOQUEADA' : 'LOGIN_FALLIDO',
        'SEGURIDAD',
        {
          detalles: bloquear
            ? `Cuenta bloqueada por 15 minutos tras alcanzar ${MAX_INTENTOS} intentos fallidos de contraseña`
            : `Contraseña incorrecta ingresada (Intento ${nuevosIntentos} de ${MAX_INTENTOS})`,
          severidad: bloquear ? 'ALTA' : 'MEDIA',
          ip: clientIp,
          dispositivo: userAgent,
          objeto_afectado: user.email
        }
      );

      if (bloquear) {
        res.status(429).json({
          error: 'Has superado el límite de 5 intentos erróneos. Por seguridad militar e institucional, la cuenta se ha bloqueado por 15 minutos.'
        });
        return;
      }

      const restantes = MAX_INTENTOS - nuevosIntentos;
      res.status(401).json({
        error: `Credenciales inválidas. Te quedan ${restantes} intento(s) antes del bloqueo temporal de la cuenta.`
      });
      return;
    }

    // Si la contraseña es válida, restablecer contadores de intentos fallidos si los había
    if (user.intentos_fallidos > 0 || user.bloqueado_hasta) {
      await prisma.usuario.update({
        where: { id: user.id },
        data: {
          intentos_fallidos: 0,
          bloqueado_hasta: null
        }
      });
    }

    const token = jwt.sign(
      { userId: user.id, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Registrar evento de Login exitoso
    await eventosService.registrarEvento(
      user.id,
      'LOGIN',
      'ACCESO',
      {
        detalles: `Inicio de sesión exitoso en el sistema (${user.rol})`,
        severidad: 'BAJA',
        ip: clientIp,
        dispositivo: userAgent,
        objeto_afectado: `${user.grado ? user.grado + ' ' : ''}${user.nombre} ${user.apellido}`
      }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
        grado: user.grado,
        ci: user.ci,
        cm: user.cm
      }
    });
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error en login' });
  }
};

export const getPerfil = async (req: any, res: Response): Promise<void> => {
  try {
    const cursanteId = req.user?.userId;
    if (!cursanteId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }
    const user = await prisma.usuario.findUnique({
      where: { id: cursanteId },
      select: {
        id: true, nombre: true, apellido: true, email: true,
        grado: true, ci: true, cm: true, promocion: true,
        telefono: true, foto_url: true, rol: true
      }
    });
    res.json(user);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

export const updatePerfil = async (req: any, res: Response): Promise<void> => {
  try {
    const cursanteId = req.user?.userId;
    if (!cursanteId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }
    const { nombre, apellido, grado, ci, cm, promocion, telefono, foto_url, email, password } = req.body;
    
    // Check if email is being changed and if it exists
    if (email) {
      const existing = await prisma.usuario.findUnique({ where: { email } });
      if (existing && existing.id !== cursanteId) {
        res.status(400).json({ error: 'El correo ya está en uso por otra cuenta' });
        return;
      }
    }

    const dataToUpdate: any = { nombre, apellido, grado, ci, cm, promocion, telefono, foto_url };
    if (email) dataToUpdate.email = email;
    
    if (password && password.trim() !== '') {
      dataToUpdate.password_hash = await bcrypt.hash(password, 10);
    }
    
    const user = await prisma.usuario.update({
      where: { id: cursanteId },
      data: dataToUpdate,
      select: {
        id: true, nombre: true, apellido: true, email: true,
        grado: true, ci: true, cm: true, promocion: true,
        telefono: true, foto_url: true, rol: true
      }
    });
    res.json(user);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};
