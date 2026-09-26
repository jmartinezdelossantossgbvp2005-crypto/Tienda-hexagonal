import { useState, useEffect } from 'react';
import { productService } from '../../services/product.service.js';
import { useAuth } from '../auth/useAuth.js';
import { ProductModal } from './ProductModal.jsx';

export const ProductList = ({ onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const { isAdmin, user } = useAuth();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este producto?')) return;
    try {
      await productService.delete(id);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Catálogo de Productos</h1>
          <p style={{ color: 'var(--text-muted)' }}>Explora los artículos disponibles y gestiona el inventario</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            style={{ width: '220px' }}
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {isAdmin && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              + Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {actionError && <div className="alert alert-danger">{actionError}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando catálogo...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron productos disponibles.</p>
        </div>
      ) : (
        <div className="grid-products">
          {filteredProducts.map((product) => {
            const hasStock = product.stock > 0;
            return (
              <div key={product.id} className="card product-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{product.name}</h3>
                    <span className={`badge ${hasStock ? 'badge-success' : 'badge-danger'}`}>
                      {hasStock ? `${product.stock} en stock` : 'Agotado'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem', minHeight: '40px' }}>
                    {product.description || 'Sin descripción disponible.'}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span className="product-price">${Number(product.price).toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isAdmin ? (
                      <>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => handleOpenEdit(product)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={!hasStock}
                        onClick={() => onAddToCart(product)}
                      >
                        {hasStock ? 'Agregar al carrito' : 'Sin existencias'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSaved={fetchProducts}
      />
    </div>
  );
};
