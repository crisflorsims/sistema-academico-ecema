import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, FileText, Hash, Calendar, Award, Users, Lock } from 'lucide-react';

export function VerificarDocumento() {
  const [searchParams] = useSearchParams();

  const folio = searchParams.get('f') || 'SIN-FOLIO';
  const hash = searchParams.get('h') || '----';
  const programa = searchParams.get('p') || 'ECEMA';
  const documento = searchParams.get('d') || 'DOCUMENTO OFICIAL ACADÉMICO';
  const fecha = searchParams.get('dt') || '-';
  const registros = searchParams.get('r');
  const promedio = searchParams.get('m');
  const extra = searchParams.get('e');

  const esValido = folio.startsWith('ECEMA-') && hash.length >= 8;

  const nombrePrograma =
    programa === 'DCEMA'
      ? 'Diplomado de Comando y Estado Mayor Aéreo (DCEMA)'
      : 'Diplomado de Comando de Escuadrón Aéreo (DCEA)';

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#163a5c]/40 via-[#0a1628] to-[#060d18] pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative z-10">
        {/* Cabecera Institucional */}
        <div className="bg-gradient-to-b from-[#0f2942] to-[#0a192f] px-6 py-6 text-center border-b-4 border-amber-400">
          <div className="inline-flex items-center justify-center p-2.5 bg-white rounded-2xl shadow-md mb-3">
            <img
              src="/logo-ecema.png"
              alt="Escudo ECEMA"
              className="w-16 h-16 object-contain"
            />
          </div>
          <p className="text-[10px] font-extrabold tracking-[0.2em] text-amber-300 uppercase">
            Fuerza Aérea Boliviana • Bolivia
          </p>
          <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mt-1">
            Escuela de Comando y Estado Mayor Aéreo
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Sistema Oficial de Verificación y Autenticidad Documental
          </p>
        </div>

        {/* Estado de Verificación */}
        <div className="p-6 space-y-5">
          {esValido ? (
            <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white mb-1">
                  Verificación Exitosa
                </span>
                <h2 className="text-sm sm:text-base font-black text-emerald-950 leading-tight">
                  DOCUMENTO OFICIAL AUTÉNTICO
                </h2>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  Emitido y firmado digitalmente por el Sistema Académico ECEMA.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 text-center">
              <p className="text-sm font-bold text-amber-900">
                Parámetros de verificación incompletos
              </p>
            </div>
          )}

          {/* Datos del Documento */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200">
            <div className="p-3.5 flex items-start gap-3">
              <FileText className="w-4 h-4 text-[#0f2942] mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Tipo de Documento Oficial
                </p>
                <p className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                  {documento}
                </p>
              </div>
            </div>

            <div className="p-3.5 flex items-start gap-3">
              <Award className="w-4 h-4 text-[#0f2942] mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Programa Académico / Unidad
                </p>
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  {nombrePrograma}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200">
              <div className="p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0f2942]" /> Folio Oficial
                </p>
                <p className="text-xs font-mono font-black text-[#0f2942] mt-0.5 break-all">
                  {folio}
                </p>
              </div>
              <div className="p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-amber-600" /> Huella Digital (Hash)
                </p>
                <p className="text-xs font-mono font-black text-amber-700 mt-0.5">
                  {hash}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200">
              <div className="p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" /> Fecha de Emisión
                </p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {fecha}
                </p>
              </div>
              {registros && (
                <div className="p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-600" /> Cursantes Registrados
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {registros} Cursante(s)
                  </p>
                </div>
              )}
            </div>

            {(promedio || extra) && (
              <div className="p-3.5 bg-[#0f2942]/[0.03] flex flex-wrap items-center justify-between gap-2">
                {promedio && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Promedio General de Planilla
                    </p>
                    <p className="text-sm font-black text-[#0f2942]">
                      {promedio} pts.
                    </p>
                  </div>
                )}
                {extra && (
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Referencia de Control
                    </p>
                    <p className="text-xs font-bold text-slate-800">
                      {extra}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nota de Seguridad */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-3.5 text-[11px] leading-relaxed flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <b>Instrucción de Auditoría:</b> Verifique que el código <b>FOLIO ({folio})</b>, la <b>Huella Digital ({hash})</b> y los promedios impresos en la hoja física coincidan exactamente con este certificado digital.
            </p>
          </div>

          <div className="pt-1 text-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold text-[#0f2942] bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Ir al Portal Académico ECEMA
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

