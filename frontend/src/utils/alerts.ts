import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Configuración global base para mantener el diseño sobrio
const baseConfig = {
  customClass: {
    popup: 'rounded-2xl shadow-2xl border border-gray-100',
    title: 'text-xl font-bold text-gray-800',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2 transition-colors shadow-sm',
    cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg px-5 py-2 transition-colors',
  },
  buttonsStyling: false, // Usamos las clases de Tailwind
};

export const showSuccess = (message: string, title: string = '¡Éxito!') => {
  return MySwal.fire({
    ...baseConfig,
    icon: 'success',
    title: title,
    text: message,
    timer: 2500,
    showConfirmButton: false,
  });
};

export const showToast = (
  message: string, 
  icon: 'success' | 'error' | 'info' | 'warning' = 'success', 
  duration: number = 1800
) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: duration,
    timerProgressBar: true,
    background: '#ffffff',
    color: '#1f2937',
    iconColor: icon === 'success' ? '#10b981' : icon === 'error' ? '#ef4444' : '#3b82f6',
    customClass: {
      popup: 'rounded-xl shadow-xl border border-gray-100 text-sm font-medium px-4 py-2.5'
    },
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });

  return Toast.fire({
    icon,
    title: message
  });
};

export const showError = (message: string, title: string = 'Error') => {
  return MySwal.fire({
    ...baseConfig,
    icon: 'error',
    title: title,
    text: message,
    confirmButtonText: 'Entendido',
  });
};

export const showConfirmDelete = async (
  itemName: string,
  extraMessage: string = 'Esta acción no se puede deshacer.'
): Promise<boolean> => {
  const result = await MySwal.fire({
    ...baseConfig,
    icon: 'warning',
    title: '¿Estás seguro?',
    html: `
      <p class="text-gray-600 mb-2">Estás a punto de eliminar:</p>
      <p class="font-bold text-lg text-gray-900 mb-2">${itemName}</p>
      <p class="text-sm text-red-500 font-medium">${extraMessage}</p>
    `,
    showCancelButton: true,
    confirmButtonText: 'Sí, Eliminar',
    cancelButtonText: 'Cancelar',
    customClass: {
      ...baseConfig.customClass,
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-5 py-2 transition-colors shadow-sm ml-3',
      actions: 'w-full flex justify-center mt-4'
    },
    reverseButtons: false,
  });

  return result.isConfirmed;
};
