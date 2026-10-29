export interface DceaMateriaDef {
  id?: number;
  nombreOficial: string;
  nombreAlias: string[];
  area: 'AREA I' | 'AREA II' | 'AREA III' | 'AREA IV';
  campo: 'doctrinario' | 'militar' | 'seguridad' | 'comando';
  peso: number;
}

export const DCEA_MATERIAS_CONFIG: DceaMateriaDef[] = [
  // --- CAMPO DOCTRINARIO ESPECÍFICO (28%) ---
  {
    id: 8,
    nombreOficial: 'ESTADO MAYOR I',
    nombreAlias: ['ESTADO MAYOR I'],
    area: 'AREA II',
    campo: 'doctrinario',
    peso: 2.00
  },
  {
    id: 13,
    nombreOficial: 'ESTADO MAYOR I (2)',
    nombreAlias: ['ESTADO MAYOR I', 'ESTADO MAYOR I (2)', 'ESTADO MAYOR I (2DA PARTE)'],
    area: 'AREA III',
    campo: 'doctrinario',
    peso: 2.00
  },
  {
    id: 2,
    nombreOficial: 'DOCTRINA BASICA',
    nombreAlias: ['DOCTRINA BASICA', 'DOCTRINA BÁSICA'],
    area: 'AREA I',
    campo: 'doctrinario',
    peso: 3.00
  },
  {
    id: 3,
    nombreOficial: 'OPS. AEROESPACIALES ESTRATÉGICAS',
    nombreAlias: ['RAC - ESTRATÉGICAS', 'RAC - ESTRATEGICAS', 'OPS. AEROESPACIALES ESTRATÉGICAS', 'OO.AA.EE.'],
    area: 'AREA I',
    campo: 'doctrinario',
    peso: 3.00
  },
  {
    id: 9,
    nombreOficial: 'OPS. AEROESPACIALES DE DEFENSA',
    nombreAlias: ['RAC - DEFENSA', 'OPS. AEROESPACIALES DE DEFENSA', 'OO.AA. DEFENSA'],
    area: 'AREA II',
    campo: 'doctrinario',
    peso: 3.00
  },
  {
    id: 14,
    nombreOficial: 'OPS. AEROESPACIALES TRANSPORTE',
    nombreAlias: ['RAC - TRANSPORTE', 'OPS. AEROESPACIALES TRANSPORTE', 'OO.AA. DE TRANSPORTE'],
    area: 'AREA III',
    campo: 'doctrinario',
    peso: 3.00
  },
  {
    id: 18,
    nombreOficial: 'OPS. AEROESPACIALES TACTICAS',
    nombreAlias: ['RAC - TÁCTICAS', 'RAC - TACTICAS', 'OPS. AEROESPACIALES TACTICAS', 'OO.AA. TACTICAS'],
    area: 'AREA IV',
    campo: 'doctrinario',
    peso: 3.00
  },
  {
    id: 5,
    nombreOficial: 'ESCUADRON AEREO',
    nombreAlias: ['COMANDO ESCUADRÓN AÉREO', 'COMANDO ESCUADRON AEREO', 'ESCUADRON AEREO', 'ESCUADRÓN AÉREO'],
    area: 'AREA I',
    campo: 'doctrinario',
    peso: 3.00
  },
  {
    id: 10,
    nombreOficial: 'ESCUADRON MANTO.',
    nombreAlias: ['COMANDO DE EDRÓN MANTENIMIENTO', 'COMANDO DE EDRON MANTENIMIENTO', 'ESCUADRON MANTO.', 'ESCUADRÓN MANTENIMIENTO'],
    area: 'AREA II',
    campo: 'doctrinario',
    peso: 3.00
  },
  {
    id: 15,
    nombreOficial: 'ESCUADRON BASE',
    nombreAlias: ['COMANDO EDRÓN BASE', 'COMANDO EDRON BASE', 'ESCUADRON BASE', 'ESCUADRÓN BASE'],
    area: 'AREA III',
    campo: 'doctrinario',
    peso: 3.00
  },

  // --- CAMPO MILITAR (17%) ---
  {
    id: 11,
    nombreOficial: 'COMUNICACIONES Y GUERRA ELECTRÓNICA',
    nombreAlias: ['COMUNICACIÓN Y GUERRA ELECTRÓNICA', 'COMUNICACION Y GUERRA ELECTRONICA', 'COMUNICACIONES Y GUERRA ELECTRÓNICA'],
    area: 'AREA II',
    campo: 'militar',
    peso: 4.25
  },
  {
    id: 7,
    nombreOficial: 'ARMAMENTO AÉREO',
    nombreAlias: ['ARMAMENTO AÉREO I', 'ARMAMENTO AEREO I', 'ARMAMENTO AÉREO', 'ARMAMENTO AEREO'],
    area: 'AREA I',
    campo: 'militar',
    peso: 4.25
  },
  {
    id: 17,
    nombreOficial: 'CÁLCULO DE ESFUERZO',
    nombreAlias: ['CALCULO DE ESFUERZO I', 'CÁLCULO DE ESFUERZO I', 'CALCULO DE ESFUERZO', 'CÁLCULO DE ESFUERZO'],
    area: 'AREA III',
    campo: 'militar',
    peso: 4.25
  },
  {
    id: 20,
    nombreOficial: 'ACCIONES MILITARES CONJUNTAS',
    nombreAlias: ['ACCIONES MILITARES CONJUNTAS', 'PLANEAMIENTO MILITAR CONJUNTO'],
    area: 'AREA IV',
    campo: 'militar',
    peso: 4.25
  },

  // --- CAMPO DE SEGURIDAD Y DEFENSA (8%) ---
  {
    id: 6,
    nombreOficial: 'INTELIGENCIA AÉREA BÁSICA',
    nombreAlias: ['INTELIGENCIA AÉREA BÁSICA', 'INTELIGENCIA AEREA BASICA'],
    area: 'AREA I',
    campo: 'seguridad',
    peso: 4.00
  },
  {
    id: 19,
    nombreOficial: 'ESCUADRON SEGURIDAD',
    nombreAlias: ['COMANDO ESCUADRÓN DE SEGURIDAD', 'COMANDO ESCUADRON DE SEGURIDAD', 'ESCUADRON SEGURIDAD', 'ESCUADRÓN SEGURIDAD'],
    area: 'AREA IV',
    campo: 'seguridad',
    peso: 4.00
  },

  // --- CAMPO COMANDO Y ADMINISTRACIÓN (7%) ---
  {
    id: 12,
    nombreOficial: 'ADM. DE PERSONAL I',
    nombreAlias: ['ADMINISTRACIÓN DE PERSONAL I', 'ADMINISTRACION DE PERSONAL I', 'ADM. DE PERSONAL I'],
    area: 'AREA II',
    campo: 'comando',
    peso: 1.75
  },
  {
    id: 16,
    nombreOficial: 'LOGÍSTICA',
    nombreAlias: ['LOGÍSTICA I', 'LOGISTICA I', 'LOGÍSTICA', 'LOGISTICA'],
    area: 'AREA III',
    campo: 'comando',
    peso: 1.75
  },
  {
    id: 22,
    nombreOficial: 'METODOLOGIA DE LA INVESTIGACION',
    nombreAlias: ['METODOLOGÍA DE LA INVESTIGACIÓN', 'METODOLOGIA DE LA INVESTIGACION'],
    area: 'AREA IV',
    campo: 'comando',
    peso: 1.75
  },
  {
    id: 21,
    nombreOficial: 'LEGISLACIÓN MILITAR',
    nombreAlias: ['LEGISLACIÓN MILITAR I Y LEY 045', 'LEGISLACION MILITAR I Y LEY 045', 'LEGISLACIÓN MILITAR', 'LEGISLACION MILITAR'],
    area: 'AREA IV',
    campo: 'comando',
    peso: 1.75
  }
];

function normalizarTexto(txt: string): string {
  return (txt || '')
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function calcularNotaMateria(calificaciones: any[]): { notaFinal: number | null; desglose: any } {
  if (!calificaciones || calificaciones.length === 0) {
    return { notaFinal: null, desglose: { p1: null, p2: null, fin: null, apr: null } };
  }

  const getNota = (evaluacionName: string): number | null => {
    const c = calificaciones.find((cal: any) => cal.evaluacion === evaluacionName);
    return c && c.nota !== null && c.nota !== undefined ? Number(c.nota) : null;
  };

  const p1 = getNota('1er Parcial');
  const p2 = getNota('2do Parcial');
  const fin = getNota('Examen Final');
  const apr = getNota('Apreciación Docente');

  const weights: { val: number | null; w: number }[] = [
    { val: p1, w: 0.25 },
    { val: p2, w: 0.25 },
    { val: fin, w: 0.40 },
    { val: apr, w: 0.10 }
  ];

  const presentWeights = weights.filter(x => x.val !== null);
  if (presentWeights.length === 0) {
    return { notaFinal: null, desglose: { p1, p2, fin, apr } };
  }

  const totalWeight = presentWeights.reduce((acc, curr) => acc + curr.w, 0);
  const weightedSum = presentWeights.reduce((acc, curr) => acc + (curr.val! * curr.w), 0);
  const notaFinal = parseFloat((weightedSum / totalWeight).toFixed(2));

  return {
    notaFinal,
    desglose: { p1, p2, fin, apr, parcial: presentWeights.length < 4 }
  };
}

export function procesarPonderacionesDCEA(
  materiasInscritas: any[],
  demeritos: any[] = [],
  ponderacionesRaw: any = {}
) {
  const campos = {
    doctrinario: { maxPeso: 28.00, puntosPonderados: 0, materias: [] as any[] },
    militar: { maxPeso: 17.00, puntosPonderados: 0, materias: [] as any[] },
    seguridad: { maxPeso: 8.00, puntosPonderados: 0, materias: [] as any[] },
    comando: { maxPeso: 7.00, puntosPonderados: 0, materias: [] as any[] }
  };

  const areas = {
    'AREA I': { maxPeso: 17.25, puntosPonderados: 0, materias: [] as any[] },
    'AREA II': { maxPeso: 14.00, puntosPonderados: 0, materias: [] as any[] },
    'AREA III': { maxPeso: 14.00, puntosPonderados: 0, materias: [] as any[] },
    'AREA IV': { maxPeso: 14.75, puntosPonderados: 0, materias: [] as any[] }
  };

  // Mapear cada materia inscrita con su definición oficial
  for (const im of materiasInscritas || []) {
    const mat = im.materia;
    if (!mat) continue;

    // Buscar coincidencia por ID primero
    let def = DCEA_MATERIAS_CONFIG.find(d => d.id === mat.id);

    // Fallback: por área y coincidencia de nombre
    if (!def) {
      const areaNombre = normalizarTexto(mat.area?.nombre || '');
      const matNombre = normalizarTexto(mat.nombre || '');
      def = DCEA_MATERIAS_CONFIG.find(d => {
        const dArea = normalizarTexto(d.area);
        const matchArea = areaNombre.includes(dArea) || dArea.includes(areaNombre);
        const matchName = d.nombreAlias.some(alias => normalizarTexto(alias) === matNombre);
        return matchArea && matchName;
      });
    }

    if (!def) continue; // Si es una materia comodín/duplicada sin área, se ignora

    const { notaFinal, desglose } = calcularNotaMateria(im.calificaciones);
    const notaVal = notaFinal !== null ? notaFinal : 0;
    const puntosAportados = parseFloat(((notaVal * def.peso) / 100).toFixed(4));

    const itemDetalle = {
      materia_id: mat.id,
      nombreOficial: def.nombreOficial,
      nombreRegistrado: mat.nombre,
      area: def.area,
      campo: def.campo,
      peso: def.peso,
      notaFinal,
      puntosAportados: parseFloat(((notaVal * def.peso) / 100).toFixed(2)),
      desglose
    };

    if (campos[def.campo]) {
      campos[def.campo].puntosPonderados += puntosAportados;
      campos[def.campo].materias.push(itemDetalle);
    }

    if (areas[def.area]) {
      areas[def.area].puntosPonderados += puntosAportados;
      areas[def.area].materias.push(itemDetalle);
    }
  }

  // Calcular notas base sobre 100 para cada campo
  const notaDoctrinario = parseFloat(((campos.doctrinario.puntosPonderados / campos.doctrinario.maxPeso) * 100).toFixed(2));
  const notaMilitar = parseFloat(((campos.militar.puntosPonderados / campos.militar.maxPeso) * 100).toFixed(2));
  const notaSeguridad = parseFloat(((campos.seguridad.puntosPonderados / campos.seguridad.maxPeso) * 100).toFixed(2));
  const notaComando = parseFloat(((campos.comando.puntosPonderados / campos.comando.maxPeso) * 100).toFixed(2));

  // Disciplina (3%): cálculo automático desde deméritos
  const totalDescuentos = (demeritos || []).reduce((sum: number, d: any) => sum + (d.puntos_totales_descontados || 0), 0);
  const notaDisciplina = Math.max(0, 50 - totalDescuentos) * 2; // escala 0-100
  const puntosDisciplina = parseFloat(((notaDisciplina * 3) / 100).toFixed(2));

  // Fusionar con notas manuales ingresadas por el evaluador
  const ponderacionesFinales: Record<string, any> = {
    ...(typeof ponderacionesRaw === 'object' && ponderacionesRaw !== null ? ponderacionesRaw : {})
  };

  // Fijar campos calculados automáticamente (impidiendo alteración manual)
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
      subtotalAcademicoMax: 60.00,
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
          puntos: parseFloat(areas['AREA I'].puntosPonderados.toFixed(2)),
          maxPeso: areas['AREA I'].maxPeso,
          materias: areas['AREA I'].materias
        },
        'AREA II': {
          puntos: parseFloat(areas['AREA II'].puntosPonderados.toFixed(2)),
          maxPeso: areas['AREA II'].maxPeso,
          materias: areas['AREA II'].materias
        },
        'AREA III': {
          puntos: parseFloat(areas['AREA III'].puntosPonderados.toFixed(2)),
          maxPeso: areas['AREA III'].maxPeso,
          materias: areas['AREA III'].materias
        },
        'AREA IV': {
          puntos: parseFloat(areas['AREA IV'].puntosPonderados.toFixed(2)),
          maxPeso: areas['AREA IV'].maxPeso,
          materias: areas['AREA IV'].materias
        }
      }
    }
  };
}
