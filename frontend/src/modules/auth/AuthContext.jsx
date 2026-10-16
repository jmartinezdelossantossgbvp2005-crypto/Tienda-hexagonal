import { createContext, useState, useEffect, useRef } from 'react';
import { authService } from '../../services/auth.service.js';

export const AuthContext = createContext(null);

const getTabInstanceId = () => {
  let id = sessionStorage.getItem('app_tab_instance_id');
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tab-${Date.now()}-${Math.random()}`;
    sessionStorage.setItem('app_tab_instance_id', id);
  }
  return id;
};

export const AuthProvider = ({ children }) => {
  const tabId = useRef(getTabInstanceId()).current;

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);

  // Estados de control de concurrencia de sesión
  const [isBlockedByAnotherTab, setIsBlockedByAnotherTab] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const claimSession = (userId) => {
    if (!userId) return;
    const ownerKey = `active_session_owner_${userId}`;
    const pingKey = `active_session_ping_${userId}`;

    localStorage.setItem(ownerKey, tabId);
    localStorage.setItem(pingKey, Date.now().toString());
    setIsBlockedByAnotherTab(false);
    setBlockReason('');

    // Notificar a otras pestañas para que cedan el control
    try {
      const channel = new BroadcastChannel('app_account_session_channel');
      channel.postMessage({
        type: 'SESSION_CLAIMED',
        userId,
        tabId
      });
      channel.close();
    } catch {
      // Ignorar si BroadcastChannel no está disponible
    }
  };

  const checkSessionOwnership = (currentUser) => {
    if (!currentUser?.id) {
      setIsBlockedByAnotherTab(false);
      setBlockReason('');
      return;
    }

    const ownerKey = `active_session_owner_${currentUser.id}`;
    const pingKey = `active_session_ping_${currentUser.id}`;

    const currentOwner = localStorage.getItem(ownerKey);
    const lastPing = parseInt(localStorage.getItem(pingKey) || '0', 10);
    const isOwnerActive = currentOwner && currentOwner !== tabId && (Date.now() - lastPing) < 4500;

    if (isOwnerActive) {
      setIsBlockedByAnotherTab(true);
      setBlockReason('Esta cuenta ya se encuentra abierta en otra pestaña de este navegador. Por motivos de seguridad, no está permitido mantener dos instancias abiertas de la misma cuenta al mismo tiempo.');
    } else {
      // Esta pestaña reclama la sesión como la legítima activa
      claimSession(currentUser.id);
    }
  };

  // Monitorear concurrencia entre pestañas con BroadcastChannel y Storage
  useEffect(() => {
    if (!user?.id) return;

    checkSessionOwnership(user);

    // Latido de presencia activa cada 2 segundos
    const heartbeatInterval = setInterval(() => {
      const ownerKey = `active_session_owner_${user.id}`;
      const pingKey = `active_session_ping_${user.id}`;
      if (localStorage.getItem(ownerKey) === tabId) {
        localStorage.setItem(pingKey, Date.now().toString());
      }
    }, 2000);

    // Canal entre pestañas del mismo navegador
    let channel = null;
    try {
      channel = new BroadcastChannel('app_account_session_channel');
      channel.onmessage = (event) => {
        const { type, userId, tabId: senderTabId } = event.data || {};
        if (userId === user.id && senderTabId !== tabId) {
          if (type === 'SESSION_CLAIMED') {
            setIsBlockedByAnotherTab(true);
            setBlockReason('Tu sesión fue abierta o transferida a otra pestaña del navegador. Esta ventana ha sido bloqueada por seguridad.');
          }
        }
      };
    } catch {
      // BroadcastChannel no soportado
    }

    // Listener de cambios en localStorage (para navegadores o pestañas en segundo plano)
    const handleStorageChange = (e) => {
      const ownerKey = `active_session_owner_${user.id}`;
      if (e.key === ownerKey && e.newValue && e.newValue !== tabId) {
        setIsBlockedByAnotherTab(true);
        setBlockReason('Tu sesión fue abierta o transferida a otra pestaña del navegador. Esta ventana ha sido bloqueada por seguridad.');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Liberar la sesión al cerrar la pestaña
    const handleBeforeUnload = () => {
      const ownerKey = `active_session_owner_${user.id}`;
      const pingKey = `active_session_ping_${user.id}`;
      if (localStorage.getItem(ownerKey) === tabId) {
        localStorage.removeItem(ownerKey);
        localStorage.removeItem(pingKey);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id]);

  // Listener de evento de servidor (401 SESSION_CONCURRENT)
  useEffect(() => {
    const handleServerConcurrent = (e) => {
      setIsBlockedByAnotherTab(true);
      setBlockReason(e.detail || 'Tu sesión ha sido abierta en otra ventana o dispositivo. Esta sesión ha caducado.');
    };
    window.addEventListener('session:concurrent', handleServerConcurrent);
    return () => window.removeEventListener('session:concurrent', handleServerConcurrent);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      const { token: jwtToken, user: userData } = response.data;
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      claimSession(userData.id);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      // Por regla de seguridad, el registro público asigna automáticamente rol 'customer'
      await authService.register({ name, email, password, role: 'customer' });
      return await login(email, password);
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (user?.id) {
      const ownerKey = `active_session_owner_${user.id}`;
      const pingKey = `active_session_ping_${user.id}`;
      if (localStorage.getItem(ownerKey) === tabId) {
        localStorage.removeItem(ownerKey);
        localStorage.removeItem(pingKey);
      }
    }
    setUser(null);
    setToken(null);
    setIsBlockedByAnotherTab(false);
    setBlockReason('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const takeOverSession = () => {
    if (user?.id) {
      claimSession(user.id);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin,
        loading,
        login,
        register,
        logout,
        isBlockedByAnotherTab,
        blockReason,
        takeOverSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from './useAuth.js';
