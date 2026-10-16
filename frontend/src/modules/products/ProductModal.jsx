import { useState, useEffect } from 'react';
import { productService } from '../../services/product.service.js';
import { getImageUrl } from '../../utils/imageUrl.js';

export const ProductModal = ({ isOpen, onClose, product, onSaved }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setPrice(product.price !== undefined ? product.price : '');
      setStock(product.stock !== undefined ? product.stock : '');
      setImagePreview(product.imageUrl || '');
      setImageFile(null);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setImagePreview('');
      setImageFile(null);
    }
    setError('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('El tamaño de la imagen no debe superar los 5 MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('price', parseFloat(price));
      formData.append('stock', parseInt(stock, 10));

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imagePreview) {
        formData.append('imageUrl', imagePreview);
      } else {
        formData.append('imageUrl', '');
      }

      if (product?.id) {
        await productService.update(product.id, formData);
      } else {
        await productService.create(formData);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {product?.id ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>X</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
              <label className="form-label">Nombre del Producto</label>
              <input
                type="text"
                required
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-textarea"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Precio ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="form-input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Inventario (Stock)</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="form-input"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Imagen del Producto</label>
              {imagePreview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <img
                    src={getImageUrl(imagePreview)}
                    alt="Vista previa"
                    style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>
                      {imageFile ? imageFile.name : 'Imagen actual'}
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: '0.35rem', color: 'var(--danger)', borderColor: '#fca5a5' }}
                      onClick={handleRemoveImage}
                    >
                      Quitar imagen
                    </button>
                  </div>
                </div>
              ) : null}

              <input
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                className="form-input"
                onChange={handleFileChange}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                Formatos permitidos: JPG, PNG, WEBP. Máx: 5 MB.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
