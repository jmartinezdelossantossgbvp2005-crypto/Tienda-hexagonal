import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { StoragePort } from '../../../../application/ports/StoragePort.js';
import { config } from '../../../config/env.js';

export class CloudinaryAdapter extends StoragePort {
  constructor(options = {}) {
    super();
    this.cloudName = options.cloudName || config.cloudinary?.cloudName;
    this.apiKey = options.apiKey || config.cloudinary?.apiKey;
    this.apiSecret = options.apiSecret || config.cloudinary?.apiSecret;

    this.isConfigured = Boolean(this.cloudName && this.apiKey && this.apiSecret);

    if (this.isConfigured) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
        secure: true
      });
    } else {
      console.warn('⚠️ CloudinaryAdapter: Faltan credenciales de Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Las subidas remotas estarán desactivadas hasta configurarlas.');
    }
  }

  /**
   * Sube un buffer de imagen a Cloudinary
   * @param {Buffer|Object} file Buffer o file object
   * @returns {Promise<string>} URL segura HTTPS de la imagen
   */
  async uploadFile(file) {
    if (!this.isConfigured) {
      throw new Error('Cloudinary no está configurado. Por favor define las variables de entorno CLOUDINARY_* en tu archivo .env.');
    }

    const buffer = Buffer.isBuffer(file) ? file : file?.buffer;
    if (!buffer) {
      throw new Error('No se recibió un buffer binario válido para subir la imagen');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'ecommerce_products',
          resource_type: 'image',
          type: 'upload',
          access_mode: 'public',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            return reject(new Error(`Error al subir imagen a Cloudinary: ${error.message}`));
          }
          resolve(result.secure_url);
        }
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  /**
   * Elimina una imagen de Cloudinary a partir de su URL pública
   * @param {string} fileUrl 
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileUrl) {
    if (!this.isConfigured || !fileUrl || typeof fileUrl !== 'string') {
      return false;
    }

    try {
      // Extraer public_id desde la URL de Cloudinary
      // Ej: https://res.cloudinary.com/demo/image/upload/v12345/ecommerce_products/sample.jpg
      const regex = /\/(ecommerce_products\/[^/.]+)\.[a-zA-Z0-9]+$/;
      const match = fileUrl.match(regex);
      let publicId = match ? match[1] : null;

      if (!publicId) {
        const parts = fileUrl.split('/');
        const filenameWithExt = parts[parts.length - 1];
        const filename = filenameWithExt.split('.')[0];
        publicId = `ecommerce_products/${filename}`;
      }

      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.warn(`Aviso: No se pudo eliminar la imagen ${fileUrl} en Cloudinary: ${error.message}`);
      return false;
    }
  }
}
