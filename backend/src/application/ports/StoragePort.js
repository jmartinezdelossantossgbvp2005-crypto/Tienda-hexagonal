/**
 * Puerto de Almacenamiento (Storage Port)
 * Define el contrato para proveedores de almacenamiento en la nube o disco
 */
export class StoragePort {
  /**
   * Sube un archivo a la infraestructura de almacenamiento
   * @param {Buffer|Object} file Buffer binario o información del archivo
   * @returns {Promise<string>} URL pública del recurso almacenado
   */
  async uploadFile(file) {
    throw new Error('Método no implementado: uploadFile');
  }

  /**
   * Elimina un archivo del almacenamiento a partir de su URL pública
   * @param {string} fileUrl URL del archivo a eliminar
   * @returns {Promise<boolean>} Indicador de éxito
   */
  async deleteFile(fileUrl) {
    throw new Error('Método no implementado: deleteFile');
  }
}
