/**
 * Resuelve la URL de una imagen para soportar tanto URLs externas (Cloudinary, etc.)
 * como archivos locales servidos por el backend (/uploads/...)
 */
export const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const backendBase = apiUrl.replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${cleanPath}`;
};
