import { useState } from 'react';
import { useAuth } from './useAuth.js';

export const AuthModal = ({ isOpen, onClose }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('customer');
  const [errorMessage, setErrorMessage] = useState('');

  const { login, register, loading } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isLoginMode) {
      const result = await login(email, password);
      if (result.success) {
        onClose();
      } else {
        setErrorMessage(result.message);
      }
    } else {
      const result = await register(name, email, password, role);
      if (result.success) {
        onClose();
      } else {
        setErrorMessage(result.message);
      }
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMessage && (
              <div className="alert alert-danger">{errorMessage}</div>
            )}

            {!isLoginMode && (
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Pérez"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input
                type="email"
                required
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  style={{ paddingRight: '4.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ej. 12345"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.5rem'
                  }}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {!isLoginMode && (
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="customer">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            )}

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setErrorMessage('');
                }}
              >
                {isLoginMode
                  ? '¿No tienes cuenta? Regístrate aquí'
                  : '¿Ya posees cuenta? Inicia sesión'}
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Procesando...' : isLoginMode ? 'Ingresar' : 'Registrarse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
