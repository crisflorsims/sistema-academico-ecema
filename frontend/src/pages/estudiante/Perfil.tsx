import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { Camera, Edit2, Key, Mail, Phone, Save, Shield, User, X, Briefcase, GraduationCap, Award, CreditCard, XCircle } from 'lucide-react';
import { showError, showSuccess } from '../../utils/alerts';

export function Perfil() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  // Obtener datos del perfil actual
  const { data: perfil, isLoading } = useQuery({
    queryKey: ['perfil'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    }
  });

  useEffect(() => {
    const loadData = () => {
      if (perfil) {
        reset({
          grado: perfil.grado || '',
          nombre: perfil.nombre || '',
          apellido: perfil.apellido || '',
          ci: perfil.ci || '',
          cm: perfil.cm || '',
          promocion: perfil.promocion || '',
          email: perfil.email || '',
          telefono: perfil.telefono || ''
        });
        if (perfil.foto_url) {
          setPreviewImage(perfil.foto_url);
        } else {
          setPreviewImage(null);
        }
      }
    };
    loadData();
  }, [perfil, reset]);

  // Manejador para convertir la imagen subida a Base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updatePerfilMutation = useMutation({
    mutationFn: async (data: any) => {
      // Adjuntar la imagen si existe
      if (previewImage) {
        data.foto_url = previewImage;
      }
      const res = await api.put('/auth/me', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfil'] });
      setIsEditing(false);
      showSuccess('Perfil actualizado exitosamente');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al actualizar perfil');
    }
  });

  const onSubmit = (data: any) => {
    updatePerfilMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (perfil) {
      reset({
        grado: perfil.grado || '',
        nombre: perfil.nombre || '',
        apellido: perfil.apellido || '',
        ci: perfil.ci || '',
        cm: perfil.cm || '',
        promocion: perfil.promocion || '',
        email: perfil.email || '',
        telefono: perfil.telefono || ''
      });
      setPreviewImage(perfil.foto_url || null);
    }
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    } else if (previewImage) {
      setIsImageModalOpen(true);
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0f2942] border-t-transparent"></div>
    </div>
  );

  const getRoleMeta = (rol?: string) => {
    switch (rol?.toUpperCase()) {
      case 'ADMIN':
        return {
          title: 'Administración Central del Sistema',
          badge: 'bg-[#0f2942] text-white border-[#0f2942]',
          accent: 'text-amber-400',
        };
      case 'EVALUADOR':
        return {
          title: 'Comisión Evaluadora • Planta Académica',
          badge: 'bg-[#0f2942]/10 text-[#0f2942] border-[#0f2942]/20',
          accent: 'text-amber-400',
        };
      case 'DOCENTE':
        return {
          title: 'Cuerpo Docente • ECEMA',
          badge: 'bg-teal-50 text-teal-800 border-teal-200',
          accent: 'text-teal-300',
        };
      case 'INSTRUCCION':
        return {
          title: 'Sección Instrucción y Disciplina',
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
          accent: 'text-amber-400',
        };
      case 'ESTUDIANTE':
      case 'CURSANTE':
        return {
          title: 'Oficial Cursante • Postgrado Aeronáutico',
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
          accent: 'text-amber-400',
        };
      default:
        return {
          title: 'Personal Institucional • ECEMA',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          accent: 'text-slate-300',
        };
    }
  };

  const roleMeta = getRoleMeta(perfil?.rol);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-8">
      
      {/* Encabezado Ejecutivo de la Ficha */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-[#0f2942]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0f2942]">
              {roleMeta.title}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Ficha Institucional de Usuario
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Datos de filiación militar, información de contacto y credenciales de acceso a la plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white font-semibold rounded-lg transition-colors text-xs shadow-2xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar Ficha
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-200 transition-colors text-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar Edición
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Columna Izquierda: Credencial Militar / Fotografía */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Franja superior azul marino */}
            <div className="bg-[#0b192c] px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  Credencial ECEMA
                </p>
                <p className="text-xs font-semibold text-white">
                  Identificación Oficial
                </p>
              </div>
              <Shield className="w-4 h-4 text-amber-400" />
            </div>

            <div className="p-6 flex flex-col items-center text-center">
              {/* Marco de Fotografía */}
              <div className="relative group mb-4">
                <div
                  onClick={handleImageClick}
                  className="w-32 h-36 rounded-lg bg-slate-100 border-2 border-slate-200 shadow-xs overflow-hidden flex items-center justify-center relative cursor-pointer"
                >
                  {previewImage ? (
                    <img src={previewImage} alt="Fotografía de Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-3">
                      <User className="w-12 h-12 mb-1 stroke-[1.5]" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Sin Fotografía</span>
                    </div>
                  )}

                  {(isEditing || previewImage) && (
                    <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-white text-[10px] font-bold tracking-wider uppercase px-2">
                        {isEditing ? 'Actualizar Foto' : 'Ampliar'}
                      </span>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#0f2942]" />
                    Subir fotografía
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Nombre y Grado */}
              <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border mb-2 ${roleMeta.badge}`}>
                {perfil?.rol || 'USUARIO'}
              </span>

              <h2 className="text-base font-bold text-slate-900 leading-snug">
                {perfil?.grado ? <span className="text-[#0f2942] mr-1">{perfil.grado}</span> : null}
                {perfil?.nombre} {perfil?.apellido}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{perfil?.email}</p>

              {/* Resumen de Matrícula / Documentos */}
              <div className="w-full mt-5 pt-4 border-t border-slate-100 space-y-2 text-left text-xs">
                <div className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-md border border-slate-200/60">
                  <span className="text-slate-500 font-medium">Carnet Militar (CM)</span>
                  <span className="font-mono font-bold text-slate-800 tabular-nums">{perfil?.cm || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-md border border-slate-200/60">
                  <span className="text-slate-500 font-medium">Cédula (CI)</span>
                  <span className="font-mono font-bold text-slate-800 tabular-nums">{perfil?.ci || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-md border border-slate-200/60">
                  <span className="text-slate-500 font-medium">Promoción</span>
                  <span className="font-mono font-bold text-slate-800 tabular-nums">{perfil?.promocion || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Datos de Filiación y Contacto */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Bloque 1: Identificación y Filiación Militar */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#0f2942]" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Filiación Militar y Datos Personales
                </h3>
              </div>
              {isEditing && (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Modo edición activo
                </span>
              )}
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Grado */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Grado / Jerarquía
                </label>
                {isEditing ? (
                  <input
                    {...register('grado')}
                    placeholder="Ej: My., Cap., Tte., Ing."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none transition-colors"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-800">
                    {perfil?.grado || 'No especificado'}
                  </div>
                )}
              </div>

              {/* Promoción */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Año / Promoción
                </label>
                {isEditing ? (
                  <input
                    {...register('promocion')}
                    placeholder="Ej: 2015"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 font-medium focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none transition-colors tabular-nums"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-mono font-semibold text-slate-800 tabular-nums">
                    {perfil?.promocion || 'No registrado'}
                  </div>
                )}
              </div>

              {/* Nombres */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nombres
                </label>
                {isEditing ? (
                  <input
                    {...register('nombre', { required: true })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none transition-colors"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-800">
                    {perfil?.nombre || '—'}
                  </div>
                )}
              </div>

              {/* Apellidos */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Apellidos
                </label>
                {isEditing ? (
                  <input
                    {...register('apellido', { required: true })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none transition-colors"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-800">
                    {perfil?.apellido || '—'}
                  </div>
                )}
              </div>

              {/* Carnet Militar */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Carnet Militar (CM)
                </label>
                {isEditing ? (
                  <input
                    {...register('cm')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 font-medium focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none transition-colors tabular-nums"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-mono font-semibold text-slate-800 tabular-nums">
                    {perfil?.cm || '—'}
                  </div>
                )}
              </div>

              {/* Cédula de Identidad */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Cédula de Identidad (CI)
                </label>
                {isEditing ? (
                  <input
                    {...register('ci')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 font-medium focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none transition-colors tabular-nums"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-mono font-semibold text-slate-800 tabular-nums">
                    {perfil?.ci || '—'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bloque 2: Contacto y Seguridad */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0f2942]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Información de Contacto y Credenciales
              </h3>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Correo Electrónico */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Correo Institucional
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    {...register('email', { required: true })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none transition-colors"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{perfil?.email || '—'}</span>
                  </div>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Teléfono / Celular
                </label>
                {isEditing ? (
                  <input
                    {...register('telefono')}
                    placeholder="Ej: 70000000"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 font-medium focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none transition-colors tabular-nums"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-mono font-semibold text-slate-800 flex items-center gap-2 tabular-nums">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{perfil?.telefono || 'No registrado'}</span>
                  </div>
                )}
              </div>

              {/* Contraseña (solo visible en modo edición) */}
              {isEditing && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Cambiar Contraseña de Acceso (Opcional)
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="Dejar en blanco para mantener la contraseña actual"
                      {...register('password')}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#0f2942]/15 focus:border-[#0f2942] outline-none transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-300 text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatePerfilMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#0f2942] hover:bg-[#163a5c] text-white font-semibold rounded-lg text-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  {updatePerfilMutation.isPending ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {updatePerfilMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            )}
          </div>

        </div>
      </form>

      {/* Modal Ampliado de Fotografía */}
      {isImageModalOpen && previewImage && (
        <div
          className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4 cursor-zoom-out"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative max-w-xl w-full flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Fotografía Ampliada"
              className="max-h-[85vh] w-auto max-w-full rounded-xl shadow-2xl border-2 border-slate-700 object-contain bg-slate-950"
            />
            <button
              className="absolute -top-10 right-0 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors"
              onClick={() => setIsImageModalOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
