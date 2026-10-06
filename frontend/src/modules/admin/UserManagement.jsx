import { useState, useEffect } from 'react';
import { userService } from '../../services/user.service.js';
import { useAuth } from '../auth/useAuth.js';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionSuccess, setActionSuccess] = useState('');

  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await userService.getAll();
      setUsers(response.data || []);
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId, userName) => {
    if (userId === currentUser?.id) {
      alert('No puedes eliminar tu propia cuenta de administrador en sesion activa.');
      return;
    }
    if (!window.confirm(`Esta seguro de eliminar al usuario "${userName}"? Esta accion cancelara sus accesos.`)) {
      return;
    }

    try {
      await userService.delete(userId);
      setActionSuccess(`Usuario "${userName}" eliminado correctamente.`);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Error al eliminar usuario');
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.id === currentUser?.id) {
      alert('No puedes cambiar tu propio rol en sesion activa.');
      return;
    }
    try {
      await userService.update(targetUser.id, { role: newRole });
      setActionSuccess(`Rol de "${targetUser.name}" actualizado a "${newRole}".`);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Error al actualizar rol');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Gestion de Usuarios</h1>
          <p style={{ color: 'var(--text-muted)' }}>Administracion de cuentas registradas, permisos y roles de acceso</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            style={{ width: '200px' }}
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="form-select"
            style={{ width: '160px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Todos los Roles</option>
            <option value="admin">Administradores</option>
            <option value="customer">Clientes</option>
          </select>

          <button className="btn btn-outline" onClick={fetchUsers}>
            Refrescar
          </button>
        </div>
      </div>

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando usuarios...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron usuarios que coincidan con la busqueda.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo Electronico</th>
                  <th>Rol Asignado</th>
                  <th>Fecha de Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} style={isCurrent ? { backgroundColor: '#f0fdf4' } : undefined}>
                      <td>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{u.name}</span>
                          {isCurrent && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Tu</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          ID: {u.id?.substring ? `${u.id.substring(0, 8)}...` : u.id}
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          className="form-select"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.8rem',
                            width: 'auto',
                            fontWeight: 600,
                            borderColor: u.role === 'admin' ? 'var(--warning)' : 'var(--primary)'
                          }}
                          value={u.role}
                          disabled={isCurrent}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                        >
                          <option value="customer">Cliente (customer)</option>
                          <option value="admin">Administrador (admin)</option>
                        </select>
                      </td>
                      <td>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        {!isCurrent ? (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                          >
                            Eliminar
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sesion actual</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
