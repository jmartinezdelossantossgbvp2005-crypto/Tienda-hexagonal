import { useState, useEffect } from 'react';
import { productService } from '../../services/product.service.js';
import { orderService } from '../../services/order.service.js';
import { userService } from '../../services/user.service.js';

export const AdminDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalCustomers: 0,
    totalAdmins: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.allSettled([
        productService.getAll(),
        orderService.getAll(),
        userService.getAll()
      ]);

      const products = productsRes.status === 'fulfilled' ? (productsRes.value.data || []) : [];
      const orders = ordersRes.status === 'fulfilled' ? (ordersRes.value.data || []) : [];
      const users = usersRes.status === 'fulfilled' ? (usersRes.value.data || []) : [];

      const lowStock = products.filter(p => p.stock <= 5);
      const pending = orders.filter(o => o.status === 'pending');
      const completed = orders.filter(o => o.status === 'completed');
      const revenue = completed.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const customers = users.filter(u => u.role === 'customer');
      const admins = users.filter(u => u.role === 'admin');

      setStats({
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        totalOrders: orders.length,
        pendingOrders: pending.length,
        completedOrders: completed.length,
        totalRevenue: revenue,
        totalUsers: users.length,
        totalCustomers: customers.length,
        totalAdmins: admins.length
      });

      setLowStockProducts(lowStock.slice(0, 5));
      setRecentOrders(orders.slice(0, 5));
    } catch (err) {
      setError(err.message || 'Error al cargar metricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando metricas del sistema...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Panel de Control de Administrador</h1>
          <p style={{ color: 'var(--text-muted)' }}>Metricas en tiempo real, estado de inventario y actividad de compras</p>
        </div>
        <button className="btn btn-outline" onClick={loadDashboardData}>
          Actualizar Datos
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Ingresos Totales (Completados)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
            ${stats.totalRevenue.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {stats.completedOrders} pedidos completados
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Pedidos Totales
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
            {stats.totalOrders}
          </div>
          <div style={{ fontSize: '0.8rem', color: stats.pendingOrders > 0 ? 'var(--warning)' : 'var(--text-muted)', marginTop: '0.25rem' }}>
            {stats.pendingOrders} pendientes de entrega
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Productos en Inventario
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
            {stats.totalProducts}
          </div>
          <div style={{ fontSize: '0.8rem', color: stats.lowStockCount > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '0.25rem' }}>
            {stats.lowStockCount > 0 ? `${stats.lowStockCount} con stock bajo (<= 5 unidades)` : 'Inventario optimo'}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Usuarios Registrados
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
            {stats.totalUsers}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {stats.totalCustomers} clientes | {stats.totalAdmins} administradores
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Ultimos Pedidos</h3>
            {onNavigate && (
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate('orders')}>
                Ver Todos
              </button>
            )}
          </div>
          {recentOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay pedidos registrados.</p>
          ) : (
            <div className="table-container">
              <table className="table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.userName || 'Cliente'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.userEmail}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>${Number(o.totalAmount).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${
                          o.status === 'completed' ? 'badge-success' : o.status === 'cancelled' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Alerta de Stock Bajo (Menor o igual a 5)</h3>
            {onNavigate && (
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate('products')}>
                Gestionar Stock
              </button>
            )}
          </div>
          {lowStockProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--success)' }}>
              Todos los productos cuentan con existencias suficientes.
            </div>
          ) : (
            <div className="table-container">
              <table className="table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td>${Number(p.price).toFixed(2)}</td>
                      <td>
                        <span className="badge badge-danger">
                          {p.stock} unidades
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      <div className="card" style={{ background: '#f8fafc', borderStyle: 'dashed' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Accesos Rapidos de Administrador</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => onNavigate && onNavigate('products')}>
            Administrar Catalogo y Productos
          </button>
          <button className="btn btn-outline" onClick={() => onNavigate && onNavigate('orders')}>
            Administrar Pedidos Globales
          </button>
          <button className="btn btn-outline" onClick={() => onNavigate && onNavigate('users')}>
            Administrar Usuarios del Sistema
          </button>
        </div>
      </div>
    </div>
  );
};
