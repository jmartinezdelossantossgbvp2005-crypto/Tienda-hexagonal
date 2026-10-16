import fs from 'fs';
import path from 'path';
import { StoragePort } from '../../../../application/ports/StoragePort.js';

export class LocalStorageAdapter extends StoragePort {
  constructor(uploadDir = null) {
    super();
    this.uploadDir = uploadDir || path.resolve(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  ensureUploadDir() {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    } catch (err) {
      console.warn('⚠️ No se pudo crear el directorio de subidas locales:', err.message);
    }
  }

  /**
   * Guarda un archivo de imagen en el disco local
   * @param {Buffer|Object} file
   * @returns {Promise<string>} Ruta relativa pública (/uploads/archivo.ext)
   */
  async uploadFile(file) {
    this.ensureUploadDir();

    const buffer = Buffer.isBuffer(file) ? file : file?.buffer;
    if (!buffer) {
      throw new Error('No se recibió un archivo binario válido para almacenar.');
    }

    // Determinar extensión del archivo
    let ext = '.jpg';
    if (file?.originalname) {
      ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    } else if (file?.mimetype) {
      const mimeMap = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
        'image/svg+xml': '.svg'
      };
      ext = mimeMap[file.mimetype] || '.jpg';
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileName = `product-${uniqueSuffix}${ext}`;
    const destinationPath = path.join(this.uploadDir, fileName);

    await fs.promises.writeFile(destinationPath, buffer);
    console.log(`✅ [Almacenamiento Local] Imagen guardada en: ${destinationPath}`);

    // Devuelve la URL relativa para ser servida por Express
    return `/uploads/${fileName}`;
  }

  /**
   * Elimina un archivo del almacenamiento local
   * @param {string} fileUrl
   */
  async deleteFile(fileUrl) {
    if (!fileUrl || !fileUrl.includes('/uploads/')) return;

    try {
      const fileName = fileUrl.split('/uploads/').pop();
      if (!fileName) return;

      const filePath = path.join(this.uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`🗑️ [Almacenamiento Local] Imagen eliminada: ${filePath}`);
      }
    } catch (err) {
      console.warn('⚠️ Error al eliminar archivo local:', err.message);
    }
  }
}
