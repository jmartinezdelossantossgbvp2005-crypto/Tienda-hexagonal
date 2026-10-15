import multer from 'multer';

// Almacenamiento en memoria para pasar el buffer binario a los Casos de Uso
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, WEBP, GIF)'), false);
  }
};

export const uploadImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5 MB por imagen
  },
  fileFilter
});
