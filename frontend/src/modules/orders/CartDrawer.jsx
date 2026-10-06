import { useState } from 'react';
import { orderService } from '../../services/order.service.js';
import { useAuth } from '../auth/useAuth.js';

export const CartDrawer = ({ isOpen, onClose, cartItems, onUpdateQuantity, onClearCart, onOrderCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  if (!isOpen) return null;

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!user) {
      setError('Debe iniciar sesión para completar la compra');
      return;
    }

    if (cartItems.length === 0) {
      setError('El carrito se encuentra vacío');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const itemsPayload = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }));

      await orderService.create({ items: itemsPayload });
      onClearCart();
      onOrderCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Carrito de Compras</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>X</button>
        </div>

        <div className="drawer-body">
          {error && <div className="alert alert-danger">{error}</div>}

          {cartItems.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
              No hay productos en el carrito.
            </p>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.name}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    ${Number(item.price).toFixed(2)} c/u
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={item.quantity >= item.stock}
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <div style={{ marginLeft: '1rem', fontWeight: 600, minWidth: '60px', textAlign: 'right' }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="drawer-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || cartItems.length === 0}
            onClick={handleCheckout}
          >
            {loading ? 'Procesando Pedido...' : 'Confirmar Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
};
