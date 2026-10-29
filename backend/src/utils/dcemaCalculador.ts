import { calcularNotaMateria } from './dceaCalculador.js';

export interface DcemaMateriaDef {
  id?: number;
  nombreOficial: string;
  nombreAlias: string[];
  area: 'AREA I' | 'AREA II' | 'AREA III' | 'AREA IV' | 'AREA V';
  campo: 'doctrinario' | 'militar' | 'seguridad' | 'comando';
  peso: number;
}

const DOCTRINARIO_MAX = 17.50;
const MILITAR_MAX = 10.50;
const SEGURIDAD_MAX = 5.00;
const COMANDO_MAX = 4.00;

export const DCEMA_MATERIAS_CONFIG: DcemaMateriaDef[] = [
  // =========================================================================
  // 1. CAMPO DOCTRINARIO ESPECÍFICO (17.50% / 9 materias = 1.9444% c/u)
  // =========================================================================
  {
    id: 23,
    nombreOficial: 'ESTADO MAYOR I',
    nombreAlias: ['ESTADO MAYOR II', 'ESTADO MAYOR I'],
    area: 'AREA I',
    campo: 'doctrinario',
    peso: Number((DOCTRINARIO_MAX / 9).toFixed(4))
  },
  {
    id: 29,
    nombreOficial: 'ESTADO MAYOR II',
    nombreAlias: ['ESTADO MAYOR II (2DA PARTE)', 'ESTADO MAYOR II'],
    area: 'AREA II',
    campo: 'doctrinario',
    peso: Number((DOCTRINARIO_MAX / 9).toFixed(4))
  },
  {
    id: 30,
    nombreOficial: 'OPERACIONES AÉREAS ESTRATÉGICAS',
    nombreAlias: ['OO.AA.EE.', 'OPERACIONES AÉREAS ESTRATÉGICAS', 'OPERACIONES AEREAS ESTRATEGICAS'],
    area: 'AREA II',
    campo: 'doctrinario',
    peso: Number((DOCTRINARIO_MAX / 9).toFixed(4))
  },
  {
    id: 35,
    nombreOficial: 'OPERACIONES AÉREAS DE DEFENSA',
    nombreAlias: ['OO.AA. DEFENSA', 'OPERACIONES AÉREAS DE DEFENSA', 'OPERACIONES AEREAS DE DEFENSA'],
    area: 'AREA III',
    campo: 'doctrinario',
    peso: Number((DOCTRINARIO_MAX / 9).toFixed(4))
  },
  {
    id: 41,
    nombreOficial: 'OPERACIONES AÉREAS DE TRANSPORTE',
    nombreAlias: ['OO.AA. DE TRANSPORTE', 'OPERACIONES AÉREAS DE TRANSPORTE', 'OPERACIONES AEREAS DE TRANSPORTE'],
    area: 'AREA IV',
    campo: 'doctrinario',
    peso: Number((DOCTRINARIO_MAX / 9).toFixed(4))
  },
  {
    id: 42,
    nombreOficial: 'OPERACIONES AÉREAS COMBINADAS',
    nombreAlias: ['OO.COMB.', 'OPERACIONES AÉREAS COMBINADAS', 'OPERACIONES AEREAS COMBINADAS'],
    area: 'AREA IV',
    campo: 'doctrinario',
    peso: Number((DOCTRINARIO_MAX / 9).toFixed(4))
  },
  {
    id: 43,
    nombreOficial: 'DOCTRINA NACIONAL MILITAR',
    nombreAlias: ['DOCTRINA NAL. Y MILITAR', 'DOCTRINA NACIONAL MILITAR'],
    area: 'AREA IV',
    campo: 'doctrinario',
    peso: Number((DOCTRINARIO_MAX / 9).toFixed(4))
  },
  {
    id: 44,
    nombreOficial: 'MANEJO DE CONFLICTOS',
    nombreAlias: ['MANEJO DE CONFLICTOS'],
    area: 'AREA IV',
    campo: 'doctrinario',
    peso: Number((DOCTRINARIO_MAX / 9).toFixed(4))
  },
  {
    id: 47,
    nombreOficial: 'OPERACIONES AÉREAS TÁCTICAS ESTRATÉGICAS',
    nombreAlias: ['OO.AA. TACTICAS', 'OO.AA. TÁCTICAS', 'OPERACIONES AÉREAS TÁCTICAS', 'OPERACIONES AÉREAS TÁCTICAS ESTRATÉGICAS'],
    area: 'AREA V',
    campo: 'doctrinario',
    peso: Number((DOCTRINARIO_MAX / 9).toFixed(4))
  },

  // =========================================================================
  // 2. CAMPO MILITAR (10.50% / 8 materias = 1.3125% c/u)
  // =========================================================================
  {
    id: 24,
    nombreOficial: 'ARMAMENTO AÉREO',
    nombreAlias: ['ARMAMENTO AÉREO', 'ARMAMENTO AEREO'],
    area: 'AREA I',
    campo: 'militar',
    peso: Number((MILITAR_MAX / 8).toFixed(4))
  },
  {
    id: 26,
    nombreOficial: 'CÁLCULO DE ESFUERZO',
    nombreAlias: ['CÁLCULO DE ESFUERZO', 'CALCULO DE ESFUERZO', 'CÁLCULO DEL ESFUERZO'],
    area: 'AREA I',
    campo: 'militar',
    peso: Number((MILITAR_MAX / 8).toFixed(4))
  },
  {
    id: 27,
    nombreOficial: 'ARTE Y DISEÑO OPERACIONAL',
    nombreAlias: ['ARTE Y DISEÑO OPERACIONAL', 'ARTE Y DISENO OPERACIONAL'],
    area: 'AREA I',
    campo: 'militar',
    peso: Number((MILITAR_MAX / 8).toFixed(4))
  },
  {
    id: 33,
    nombreOficial: 'COMUNICACIÓN Y GUERRA ELECTRÓNICA',
    nombreAlias: ['COMUNICACIONES Y GUERRA ELECTRÓNICA', 'COMUNICACIONES Y GUERRA ELECTRONICA', 'COMUNICACIÓN Y GUERRA ELECTRÓNICA', 'COMUNICACION Y GUERRA ELECTRONICA'],
    area: 'AREA II',
    campo: 'militar',
    peso: Number((MILITAR_MAX / 8).toFixed(4))
  },
  {
    id: 34,
    nombreOficial: 'FENIX (MULA)',
    nombreAlias: ['JUEGOS DE GERRA FÉNIX', 'JUEGOS DE GERRA FENIX', 'JUEGOS DE GUERRA FÉNIX', 'FENIX (MULA)', 'FENIX'],
    area: 'AREA II',
    campo: 'militar',
    peso: Number((MILITAR_MAX / 8).toFixed(4))
  },
  {
    id: 45,
    nombreOficial: 'TEORÍA DE LA DECISIÓN / SICOFAA',
    nombreAlias: ['SICOFAA', 'TEORÍA DE LA DECISIÓN', 'TEORIA DE LA DECISION'],
    area: 'AREA IV',
    campo: 'militar',
    peso: Number((MILITAR_MAX / 8).toFixed(4))
  },
  {
    id: 48,
    nombreOficial: 'PLANEAMIENTO MILITAR CONJUNTO',
    nombreAlias: ['PLANEAMIENTO MILITAR CONJUNTO'],
    area: 'AREA V',
    campo: 'militar',
    peso: Number((MILITAR_MAX / 8).toFixed(4))
  },
  {
    id: 50,
    nombreOficial: 'PROSPECTIVA',
    nombreAlias: ['PROSPECTIVA'],
    area: 'AREA V',
    campo: 'militar',
    peso: Number((MILITAR_MAX / 8).toFixed(4))
  },

  // =========================================================================
  // 3. CAMPO DE SEGURIDAD Y DEFENSA (5.00% / 7 materias = 0.7143% c/u)
  // =========================================================================
  {
    id: 25,
    nombreOficial: 'INTELIGENCIA ESTRATÉGICA',
    nombreAlias: ['INTELIGENCIA ESTRATÉGICA', 'INTELIGENCIA ESTRATEGICA'],
    area: 'AREA I',
    campo: 'seguridad',
    peso: Number((SEGURIDAD_MAX / 7).toFixed(4))
  },
  {
    id: 32,
    nombreOficial: 'INTRODUCCIÓN AL PODER AÉREO',
    nombreAlias: ['PODER AÉREO', 'PODER AEREO', 'INTRODUCCIÓN AL PODER AÉREO', 'INTRODUCCION AL PODER AEREO'],
    area: 'AREA II',
    campo: 'seguridad',
    peso: Number((SEGURIDAD_MAX / 7).toFixed(4))
  },
  {
    id: 36,
    nombreOficial: 'DERECHO INTERNACIONAL EN CONFLICTO ARMADO - DICA',
    nombreAlias: ['DICA', 'DERECHO INTERNACIONAL EN CONFLICTO ARMADO - DICA'],
    area: 'AREA III',
    campo: 'seguridad',
    peso: Number((SEGURIDAD_MAX / 7).toFixed(4))
  },
  {
    id: 37,
    nombreOficial: 'PODER AÉREO II / PREVENCIÓN DE ACCIDENTES',
    nombreAlias: ['PODER AÉREO II', 'PODER AEREO II', 'PREVENCIÓN DE ACCIDENTES', 'PREVENCION DE ACCIDENTES'],
    area: 'AREA III',
    campo: 'seguridad',
    peso: Number((SEGURIDAD_MAX / 7).toFixed(4))
  },
  {
    id: 38,
    nombreOficial: 'AMENAZAS NO CONVENCIONALES',
    nombreAlias: ['AMENAZAS NO CONVENCIONALES'],
    area: 'AREA III',
    campo: 'seguridad',
    peso: Number((SEGURIDAD_MAX / 7).toFixed(4))
  },
  {
    id: 39,
    nombreOficial: 'SEGURIDAD Y DEFENSA DEL ESTADO',
    nombreAlias: ['CIBER SEGURIDAD Y CIBER DEFENSA', 'SEGURIDAD Y DEFENSA DEL ESTADO'],
    area: 'AREA III',
    campo: 'seguridad',
    peso: Number((SEGURIDAD_MAX / 7).toFixed(4))
  },
  {
    id: 49,
    nombreOficial: 'GEOPOLÍTICA II',
    nombreAlias: ['GEOPOLÍTICA II', 'GEOPOLITICA II'],
    area: 'AREA V',
    campo: 'seguridad',
    peso: Number((SEGURIDAD_MAX / 7).toFixed(4))
  },

  // =========================================================================
  // 4. CAMPO COMANDO Y ADMINISTRACIÓN (4.00% / 6 materias = 0.6667% c/u)
  // =========================================================================
  {
    id: 28,
    nombreOficial: 'ADMINISTRACIÓN DE PERSONAL II',
    nombreAlias: ['ADMINISTRACIÓN DE PERSONAL', 'ADMINISTRACION DE PERSONAL', 'ADMINISTRACIÓN DE PERSONAL II', 'ADMINISTRACION DE PERSONAL II'],
    area: 'AREA I',
    campo: 'comando',
    peso: Number((COMANDO_MAX / 6).toFixed(4))
  },
  {
    id: 31,
    nombreOficial: 'ADMINISTRACIÓN DE MATERIAL II',
    nombreAlias: ['ADMINISTRACIÓN DE MATERIAL', 'ADMINISTRACION DE MATERIAL', 'ADMINISTRACIÓN DE MATERIAL II', 'ADMINISTRACION DE MATERIAL II'],
    area: 'AREA II',
    campo: 'comando',
    peso: Number((COMANDO_MAX / 6).toFixed(4))
  },
  {
    id: 40,
    nombreOficial: 'ADMINISTRACIÓN FINANCIERA (LEY 1178 SAFCO)',
    nombreAlias: ['ADMINISTRACIÓN FINANCIERA', 'ADMINISTRACION FINANCIERA', 'LEY 1178 SAFCO'],
    area: 'AREA III',
    campo: 'comando',
    peso: Number((COMANDO_MAX / 6).toFixed(4))
  },
  {
    id: 46,
    nombreOficial: 'PLAN ESTRATÉGICO INSTITUCIONAL',
    nombreAlias: ['PLANEAMIENTO NAL. E INST.', 'PLAN ESTRATÉGICO INSTITUCIONAL', 'PLAN ESTRATEGICO INSTITUCIONAL'],
    area: 'AREA IV',
    campo: 'comando',
    peso: Number((COMANDO_MAX / 6).toFixed(4))
  },
  {
    id: 51,
    nombreOficial: 'METODOLOGÍA DE LA INVESTIGACIÓN',
    nombreAlias: ['METODOLOGÍA DE LA INVESTIGACIÓN', 'METODOLOGIA DE LA INVESTIGACION'],
    area: 'AREA V',
    campo: 'comando',
    peso: Number((COMANDO_MAX / 6).toFixed(4))
  },
  {
    id: 52,
    nombreOficial: 'ELABORACIÓN DE PROYECTOS',
    nombreAlias: ['ELABORACIÓN DE PROYECTOS', 'ELABORACION DE PROYECTOS'],
    area: 'AREA V',
    campo: 'comando',
    peso: Number((COMANDO_MAX / 6).toFixed(4))
  }
];

function normalizarTexto(txt: string): string {
  return (txt || '')
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function procesarPonderacionesDCEMA(
  materiasInscritas: any[],
  demeritos: any[] = [],
  ponderacionesRaw: any = {}
) {
  const campos = {
    doctrinario: { maxPeso: DOCTRINARIO_MAX, puntosPonderados: 0, materias: [] as any[] },
    militar: { maxPeso: MILITAR_MAX, puntosPonderados: 0, materias: [] as any[] },
    seguridad: { maxPeso: SEGURIDAD_MAX, puntosPonderados: 0, materias: [] as any[] },
    comando: { maxPeso: COMANDO_MAX, puntosPonderados: 0, materias: [] as any[] }
  };

  const areas: Record<string, { maxPeso: number; puntosPonderados: number; materias: any[] }> = {
    'AREA I': { maxPeso: 0, puntosPonderados: 0, materias: [] },
    'AREA II': { maxPeso: 0, puntosPonderados: 0, materias: [] },
    'AREA III': { maxPeso: 0, puntosPonderados: 0, materias: [] },
    'AREA IV': { maxPeso: 0, puntosPonderados: 0, materias: [] },
    'AREA V': { maxPeso: 0, puntosPonderados: 0, materias: [] }
  };

  for (const d of DCEMA_MATERIAS_CONFIG) {
    if (areas[d.area]) {
      areas[d.area]!.maxPeso = parseFloat((areas[d.area]!.maxPeso + d.peso).toFixed(2));
    }
  }

  for (const im of materiasInscritas || []) {
    const mat = im.materia;
    if (!mat) continue;

    let def = DCEMA_MATERIAS_CONFIG.find(d => d.id === mat.id);

    if (!def) {
      const matNombre = normalizarTexto(mat.nombre || '');
      def = DCEMA_MATERIAS_CONFIG.find(d =>
        d.nombreAlias.some(alias => normalizarTexto(alias) === matNombre)
      );
    }

    if (!def) continue;

    const { notaFinal, desglose } = calcularNotaMateria(im.calificaciones);
    const notaVal = notaFinal !== null ? notaFinal : 0;

    // Peso exacto dentro de su campo (equitativo entre las asignaturas del campo)
    const totalMateriasCampo = DCEMA_MATERIAS_CONFIG.filter(x => x.campo === def!.campo).length || 1;
    const pesoExacto = campos[def.campo].maxPeso / totalMateriasCampo;
    const puntosAportados = (notaVal * pesoExacto) / 100;

    const itemDetalle = {
      materia_id: mat.id,
      nombreOficial: def.nombreOficial,
      nombreRegistrado: mat.nombre,
      area: def.area,
      campo: def.campo,
      peso: parseFloat(pesoExacto.toFixed(2)),
      notaFinal,
      puntosAportados: parseFloat(puntosAportados.toFixed(2)),
      desglose
    };

    if (campos[def.campo]) {
      campos[def.campo].puntosPonderados += puntosAportados;
      campos[def.campo].materias.push(itemDetalle);
    }

    if (areas[def.area]) {
      areas[def.area]!.puntosPonderados += puntosAportados;
      areas[def.area]!.materias.push(itemDetalle);
    }
  }

  const notaDoctrinario = parseFloat(((campos.doctrinario.puntosPonderados / campos.doctrinario.maxPeso) * 100).toFixed(2));
  const notaMilitar = parseFloat(((campos.militar.puntosPonderados / campos.militar.maxPeso) * 100).toFixed(2));
  const notaSeguridad = parseFloat(((campos.seguridad.puntosPonderados / campos.seguridad.maxPeso) * 100).toFixed(2));
  const notaComando = parseFloat(((campos.comando.puntosPonderados / campos.comando.maxPeso) * 100).toFixed(2));

  // Disciplina (3%): cálculo automático desde deméritos
  const totalDescuentos = (demeritos || []).reduce((sum: number, d: any) => sum + (d.puntos_totales_descontados || 0), 0);
  const notaDisciplina = Math.max(0, 50 - totalDescuentos) * 2;
  const puntosDisciplina = parseFloat(((notaDisciplina * 3) / 100).toFixed(2));

  const ponderacionesFinales: Record<string, any> = {
    ...(typeof ponderacionesRaw === 'object' && ponderacionesRaw !== null ? ponderacionesRaw : {})
  };

  ponderacionesFinales.doctrinario = notaDoctrinario;
  ponderacionesFinales.militar = notaMilitar;
  ponderacionesFinales.seguridad = notaSeguridad;
  ponderacionesFinales.comando = notaComando;
  ponderacionesFinales.disciplina = notaDisciplina;

  const subtotalAcademicoPuntos = parseFloat((
    campos.doctrinario.puntosPonderados +
    campos.militar.puntosPonderados +
    campos.seguridad.puntosPonderados +
    campos.comando.puntosPonderados
  ).toFixed(2));

  return {
    ponderaciones: ponderacionesFinales,
    detallesDCEA: {
      subtotalAcademicoPuntos,
      subtotalAcademicoMax: 37.00,
      disciplinaPuntos: puntosDisciplina,
      campos: {
        doctrinario: {
          puntos: parseFloat(campos.doctrinario.puntosPonderados.toFixed(2)),
          maxPeso: campos.doctrinario.maxPeso,
          notaBase: notaDoctrinario,
          materias: campos.doctrinario.materias
        },
        militar: {
          puntos: parseFloat(campos.militar.puntosPonderados.toFixed(2)),
          maxPeso: campos.militar.maxPeso,
          notaBase: notaMilitar,
          materias: campos.militar.materias
        },
        seguridad: {
          puntos: parseFloat(campos.seguridad.puntosPonderados.toFixed(2)),
          maxPeso: campos.seguridad.maxPeso,
          notaBase: notaSeguridad,
          materias: campos.seguridad.materias
        },
        comando: {
          puntos: parseFloat(campos.comando.puntosPonderados.toFixed(2)),
          maxPeso: campos.comando.maxPeso,
          notaBase: notaComando,
          materias: campos.comando.materias
        }
      },
      areas: {
        'AREA I': {
          puntos: parseFloat(areas['AREA I']!.puntosPonderados.toFixed(2)),
          maxPeso: areas['AREA I']!.maxPeso,
          materias: areas['AREA I']!.materias
        },
        'AREA II': {
          puntos: parseFloat(areas['AREA II']!.puntosPonderados.toFixed(2)),
          maxPeso: areas['AREA II']!.maxPeso,
          materias: areas['AREA II']!.materias
        },
        'AREA III': {
          puntos: parseFloat(areas['AREA III']!.puntosPonderados.toFixed(2)),
          maxPeso: areas['AREA III']!.maxPeso,
          materias: areas['AREA III']!.materias
        },
        'AREA IV': {
          puntos: parseFloat(areas['AREA IV']!.puntosPonderados.toFixed(2)),
          maxPeso: areas['AREA IV']!.maxPeso,
          materias: areas['AREA IV']!.materias
        },
        'AREA V': {
          puntos: parseFloat(areas['AREA V']!.puntosPonderados.toFixed(2)),
          maxPeso: areas['AREA V']!.maxPeso,
          materias: areas['AREA V']!.materias
        }
      }
    }
  };
}

