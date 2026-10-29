const originalExit = process.exit;
process.exit = function(code?: number) {
  console.trace('PROCESS EXIT CALLED:', code);
  originalExit(code);
} as any;
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import diplomasRoutes from './routes/diplomas.routes.js';
import usersRoutes from './routes/users.routes.js';
import calificacionesRoutes from './routes/calificaciones.routes.js';
import periodosRoutes from './routes/periodos.routes.js';
import edicionesRoutes from './routes/ediciones.routes.js';
import inscripcionesRoutes from './routes/inscripciones.routes.js';
import docentesRoutes from './routes/docentes.routes.js';
import estudiantesRoutes from './routes/estudiantes.routes.js';
import reportesRoutes from './routes/reportes.routes.js';
import eventosRoutes from './routes/eventos.routes.js';
import evaluadoresRoutes from './routes/evaluadores.routes.js';
import disciplinaRoutes from './routes/disciplina.routes.js';
import sancionadorRoutes from './routes/sancionador.routes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/diplomas', diplomasRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/periodos', periodosRoutes);
app.use('/api/ediciones', edicionesRoutes);
app.use('/api/inscripciones', inscripcionesRoutes);
app.use('/api/docentes', docentesRoutes);
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/evaluadores', evaluadoresRoutes);
app.use('/api/disciplina', disciplinaRoutes);
app.use('/api/sancionadores', sancionadorRoutes);

// Healthcheck para servicios de hosting (Render / Railway)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ECEMA Academic System API' });
});

// Servir el frontend compilado (dist) en producción / hosting unificado
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

setInterval(() => {}, 60000);
