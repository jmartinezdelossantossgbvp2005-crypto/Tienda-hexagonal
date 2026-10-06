import { useState } from 'react';
import { useAuth } from '../auth/useAuth.js';
import { userService } from '../../services/user.service.js';

export const UserProfile = () => {
  const { user, logout, isAdmin } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No has iniciado sesion</h2>
        <p style={{ color: 'var(--text-muted)' }}>Por favor ingresa con tus credenciales para ver tu perfil.</p>
      </div>
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await userService.update(user.id, { name });
      const updatedUser = { ...user, name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente. Los cambios se reflejaran de inmediato.' });
      setIsEditing(false);
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Error al actualizar el perfil' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Mi Perfil de Usuario</h1>
        <p style={{ color: 'var(--text-muted)' }}>Informacion de cuenta, rol y permisos en el sistema</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: isAdmin ? '#fef3c7' : '#e0f2fe',
            color: isAdmin ? '#b45309' : '#0369a1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            fontWeight: 700
          }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{user.name}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
              <span className={`badge ${isAdmin ? 'badge-warning' : 'badge-info'}`}>
                {isAdmin ? 'Administrador' : 'Cliente'}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>- {user.email}</span>
            </div>
          </div>
        </div>

        {!isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>ID de Usuario:</span>
              <span style={{ fontFamily: 'monospace' }}>{user.id}</span>

              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Nombre Completo:</span>
              <span style={{ fontWeight: 600 }}>{user.name}</span>

              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Correo Electronico:</span>
              <span>{user.email}</span>

              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Rol en el Sistema:</span>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{user.role}</span>

              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Permisos:</span>
              <span>
                {isAdmin 
                  ? 'Acceso total (Dashboard, Administracion de Productos, Pedidos Globales, Administracion de Usuarios)' 
                  : 'Catalogo de Compras, Carrito de Compras, Historial de Mis Pedidos y Perfil Personal'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                Editar Nombre
              </button>
              <button className="btn btn-danger" onClick={logout}>
                Cerrar Sesion
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Nombre Completo</label>
              <input
                type="text"
                className="form-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Correo Electronico</label>
              <input
                type="email"
                className="form-input"
                disabled
                value={user.email}
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>El correo electronico es el identificador principal y no puede modificarse.</small>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card" style={{ background: '#f8fafc' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Informacion de Sesion y Seguridad</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Tu sesion esta protegida mediante Tokens JWT encriptados. Las peticiones a la API validan tu rol ({user.role}) en cada recurso protegido segun la arquitectura hexagonal del backend.
        </p>
      </div>
    </div>
  );
};
