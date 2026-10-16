import { BcryptJwtAdapter } from '../../../outbound/security/BcryptJwtAdapter.js';
import { pool } from '../../../outbound/postgres/connection.js';
import { PostgresUserRepository } from '../../../outbound/postgres/PostgresUserRepository.js';

const securityService = new BcryptJwtAdapter();
const userRepository = new PostgresUserRepository(pool);

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación no proporcionado o formato inválido'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = securityService.verifyToken(token);

    // Control de concurrencia de sesión única
    if (decoded.sessionId && decoded.id) {
      const user = await userRepository.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado'
        });
      }

      if (user.activeSessionId && user.activeSessionId !== decoded.sessionId) {
        return res.status(401).json({
          success: false,
          code: 'SESSION_CONCURRENT',
          message: 'Tu sesión ha sido abierta en otra ventana o navegador. Por seguridad, esta sesión ha caducado.'
        });
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación expirado o inválido'
    });
  }
};

export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No posee los permisos necesarios para realizar esta acción'
      });
    }
    next();
  };
};
