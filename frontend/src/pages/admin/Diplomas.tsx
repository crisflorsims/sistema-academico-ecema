import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { Edit, Trash2 } from 'lucide-react';
import { showSuccess, showError } from '../../utils/alerts';

export function Diplomas() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materiaModalFor, setMateriaModalFor] = useState<number | null>(null);
  const [areaModalFor, setAreaModalFor] = useState<number | null>(null);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [editingMateria, setEditingMateria] = useState<any>(null);

  const { register: regDip, handleSubmit: handleDipSubmit, reset: resetDip } = useForm();
  const { register: regMat, handleSubmit: handleMatSubmit, reset: resetMat } = useForm();
  const { register: regArea, handleSubmit: handleAreaSubmit, reset: resetArea } = useForm();

  const { data: diplomas, isLoading, error } = useQuery({
    queryKey: ['diplomas'],
    queryFn: async () => {
      const res = await api.get('/diplomas');
      return res.data;
    }
  });

  const createDiplomadoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/diplomas', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diplomas'] });
      setIsModalOpen(false);
      resetDip();
      showSuccess('Diplomado creado exitosamente');
    },
    onError: () => showError('Error al crear diplomado')
  });

  const createAreaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/diplomas/${areaModalFor}/areas`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diplomas'] });
      setAreaModalFor(null);
      resetArea();
      showSuccess('Área agregada exitosamente');
    },
    onError: () => showError('Error al agregar área')
  });

  const updateAreaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/diplomas/areas/${editingArea.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diplomas'] });
      setEditingArea(null);
      resetArea();
      showSuccess('Área actualizada exitosamente');
    },
    onError: () => showError('Error al actualizar área')
  });

  const createMateriaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/diplomas/${materiaModalFor}/materias`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diplomas'] });
      setMateriaModalFor(null);
      resetMat();
      showSuccess('Materia agregada exitosamente');
    },
    onError: () => showError('Error al agregar materia')
  });

  const updateMateriaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/diplomas/materias/${editingMateria.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diplomas'] });
      setEditingMateria(null);
      resetMat();
      showSuccess('Materia actualizada exitosamente');
    },
    onError: () => showError('Error al actualizar materia')
  });

  const onSubmitDiplomado = (data: any) => {
    createDiplomadoMutation.mutate(data);
  };

  const onSubmitArea = (data: any) => {
    if (editingArea) {
      updateAreaMutation.mutate(data);
    } else {
      createAreaMutation.mutate(data);
    }
  };

  const onSubmitMateria = (data: any) => {
    const payload = {
      ...data,
      creditos: data.creditos ? parseInt(data.creditos) : null,
      horas: data.horas ? parseInt(data.horas) : null,
      orden: parseInt(data.orden),
      area_id: data.area_id ? parseInt(data.area_id) : null
    };

    if (editingMateria) {
      updateMateriaMutation.mutate(payload);
    } else {
      createMateriaMutation.mutate(payload);
    }
  };

  const openEditArea = (area: any) => {
    setEditingArea(area);
    resetArea({ nombre: area.nombre });
  };

  const openEditMateria = (materia: any) => {
    setEditingMateria(materia);
    resetMat({
      nombre: materia.nombre,
      descripcion: materia.descripcion,
      creditos: materia.creditos,
      horas: materia.horas,
      orden: materia.orden,
      area_id: materia.area_id || ''
    });
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 text-sm font-medium">Cargando programas académicos...</div>;
  if (error) return <div className="p-8 text-center text-red-600 text-sm font-semibold">Error al cargar programas académicos</div>;

  const currentDiplomadoForMateria = diplomas?.find((d: any) => 
    d.id === materiaModalFor || (editingMateria && d.id === editingMateria.diplomado_id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 border-l-4 border-l-[#0f2942] shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
            Jefatura de Estudios • Planificación Curricular
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Programas de Diplomado y Malla Curricular
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Administración de programas de posgrado militar, áreas de conocimiento y asignaturas reglamentarias.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0f2942] hover:bg-[#163a5c] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          + Nuevo Diplomado
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {diplomas?.map((d: any) => {
          return (
          <div key={d.id} className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-800 bg-[#0f2942] text-white flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider rounded">
                    {d.tipo}
                  </span>
                  <span className="px-2.5 py-0.5 bg-white/10 text-slate-200 border border-white/15 text-[10px] font-mono font-semibold rounded">
                    {d.duracion || 'N/A'}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-white leading-snug">{d.nombre}</h3>
                <p className="text-xs text-slate-300 mt-1">{d.descripcion || 'Programa oficial de formación y perfeccionamiento militar.'}</p>
              </div>
            </div>
            
            <div className="p-5 sm:p-6 flex-1 space-y-4 bg-slate-50/40">
              <div className="flex justify-end items-center gap-2 border-b border-slate-200 pb-3">
                <button 
                  onClick={() => { resetArea(); setAreaModalFor(d.id); }}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  + Agregar Área
                </button>
                <button 
                  onClick={() => { resetMat(); setMateriaModalFor(d.id); }}
                  className="px-3 py-1.5 rounded-lg bg-[#0f2942] hover:bg-[#163a5c] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  + Agregar Asignatura
                </button>
              </div>
              
              {/* Áreas */}
              {d.areas?.map((area: any) => (
                <div key={area.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-[#0f2942] rounded-xs"></span>
                      {area.nombre}
                    </h5>
                    <button 
                      onClick={() => openEditArea(area)}
                      className="text-slate-600 hover:text-[#0f2942] text-xs px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                      title="Editar Área"
                    >
                      <Edit size={13} /> Editar
                    </button>
                  </div>
                  <div className="p-2">
                    {area.materias?.length > 0 ? (
                      <ul className="divide-y divide-slate-100">
                        {area.materias.sort((a:any, b:any) => a.orden - b.orden).map((m: any) => (
                          <li key={m.id} className="flex justify-between items-center px-3 py-2 hover:bg-slate-50 rounded text-xs group">
                            <span className="font-semibold text-slate-800">
                              <span className="font-mono tabular-nums text-slate-400 mr-1.5">{m.orden}.</span>
                              {m.nombre}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 font-mono tabular-nums text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {m.creditos || 0} CR
                              </span>
                              <button 
                                onClick={() => openEditMateria(m)}
                                className="opacity-0 group-hover:opacity-100 text-[#0f2942] hover:bg-slate-100 transition-opacity p-1 border border-slate-200 rounded cursor-pointer"
                                title="Editar Asignatura"
                              >
                                <Edit size={13} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic p-2">Sin asignaturas registradas en esta área</p>
                    )}
                  </div>
                </div>
              ))}

              {d.areas?.length === 0 && d.materias?.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-6">No hay áreas ni asignaturas registradas.</p>
              )}
            </div>
          </div>
        )})}
      </div>

      {/* Modal Nuevo Diplomado */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-[#0f2942] text-white flex justify-between items-center">
              <h3 className="text-base font-bold">Registrar Programa de Diplomado</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleDipSubmit(onSubmitDiplomado)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre del Diplomado</label>
                <input {...regDip('nombre', { required: true })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Descripción</label>
                <textarea {...regDip('descripcion')} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Régimen</label>
                  <select {...regDip('tipo')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white">
                    <option value="ANUAL">Anual</option>
                    <option value="SEMESTRAL">Semestral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Duración (ej: 6 meses)</label>
                  <input {...regDip('duracion')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-lg cursor-pointer">Cancelar</button>
                <button type="submit" disabled={createDiplomadoMutation.isPending} className="px-4 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white text-xs font-bold rounded-lg cursor-pointer">
                  {createDiplomadoMutation.isPending ? 'Guardando...' : 'Guardar Diplomado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Área */}
      {(areaModalFor !== null || editingArea !== null) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-[#0f2942] text-white flex justify-between items-center">
              <h3 className="text-base font-bold">{editingArea ? 'Editar Área Curricular' : 'Agregar Área / Bloque Curricular'}</h3>
              <button onClick={() => { setAreaModalFor(null); setEditingArea(null); }} className="text-slate-300 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAreaSubmit(onSubmitArea)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre del Área</label>
                <input {...regArea('nombre', { required: true })} placeholder="Ej: Estrategia, Operaciones..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none" />
              </div>
              
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => { setAreaModalFor(null); setEditingArea(null); }} className="px-4 py-2 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-lg cursor-pointer">Cancelar</button>
                <button type="submit" disabled={createAreaMutation.isPending || updateAreaMutation.isPending} className="px-4 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white text-xs font-bold rounded-lg cursor-pointer">
                  {createAreaMutation.isPending || updateAreaMutation.isPending ? 'Guardando...' : 'Guardar Área'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Materia */}
      {(materiaModalFor !== null || editingMateria !== null) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-[#0f2942] text-white flex justify-between items-center">
              <h3 className="text-base font-bold">{editingMateria ? 'Editar Asignatura' : 'Agregar Asignatura'}</h3>
              <button onClick={() => { setMateriaModalFor(null); setEditingMateria(null); }} className="text-slate-300 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleMatSubmit(onSubmitMateria)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre de la Asignatura</label>
                <input {...regMat('nombre', { required: true })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none" />
              </div>
              
              {currentDiplomadoForMateria?.areas?.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Área Curricular {editingMateria ? '' : '(Requerido)'}</label>
                  <select {...regMat('area_id', { required: true })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none bg-white">
                    <option value="">-- Seleccionar Área --</option>
                    {currentDiplomadoForMateria.areas.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Créditos</label>
                  <input type="number" {...regMat('creditos')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Horas</label>
                  <input type="number" {...regMat('horas')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Orden (#)</label>
                  <input type="number" {...regMat('orden', { required: true })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => { setMateriaModalFor(null); setEditingMateria(null); }} className="px-4 py-2 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-lg cursor-pointer">Cancelar</button>
                <button type="submit" disabled={createMateriaMutation.isPending || updateMateriaMutation.isPending} className="px-4 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white text-xs font-bold rounded-lg cursor-pointer">
                  {createMateriaMutation.isPending || updateMateriaMutation.isPending ? 'Guardando...' : 'Guardar Asignatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
