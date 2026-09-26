import { BcryptJwtAdapter } from '../../../outbound/security/BcryptJwtAdapter.js';

const securityService = new BcryptJwtAdapter();

export const authenticate = (req, res, next) => {
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
