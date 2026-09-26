import { useState, useEffect } from 'react';
import { orderService } from '../../services/order.service.js';
import { useAuth } from '../auth/useAuth.js';

export const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const { isAdmin, user } = useAuth();

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderService.getAll();
      setOrders(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('¿Está seguro de eliminar este pedido?')) return;
    try {
      await orderService.delete(orderId);
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };


  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Completado</span>;
      case 'cancelled':
        return <span className="badge badge-danger">Cancelado</span>;
      default:
        return <span className="badge badge-warning">Pendiente</span>;
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Por favor inicie sesión para consultar el historial de pedidos.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            {isAdmin ? 'Gestión Global de Pedidos' : 'Mis Pedidos'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isAdmin
              ? 'Supervisión y actualización de órdenes realizadas por clientes'
              : 'Historial de compras y seguimiento de transacciones'}
          </p>
        </div>

        <button className="btn btn-outline" onClick={fetchOrders}>
          Refrescar
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No se registran pedidos actualmente.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID Pedido</th>
                  {isAdmin && <th>Cliente</th>}
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {order.id.substring(0, 8)}...
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ fontWeight: 500 }}>{order.userName || 'Usuario'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.userEmail}
                        </div>
                      </td>
                    )}
                    <td>
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ fontWeight: 600 }}>${Number(order.totalAmount).toFixed(2)}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => toggleExpand(order.id)}
                        >
                          {expandedOrderId === order.id ? 'Ocultar' : 'Detalles'}
                        </button>

                        {isAdmin && (
                          <>
                            <select
                              className="form-select"
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', width: 'auto' }}
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            >
                              <option value="pending">Pendiente</option>
                              <option value="completed">Completado</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {expandedOrderId && (
        <div className="modal-backdrop" onClick={() => setExpandedOrderId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Detalle de Artículos</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setExpandedOrderId(null)}>✕</button>
            </div>
            <div className="modal-body">
              {(() => {
                const currentOrder = orders.find(o => o.id === expandedOrderId);
                if (!currentOrder || !currentOrder.items) return null;
                return (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrder.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td>{item.productName || item.productId}</td>
                          <td>{item.quantity}</td>
                          <td>${Number(item.unitPrice).toFixed(2)}</td>
                          <td style={{ fontWeight: 600 }}>${Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setExpandedOrderId(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
