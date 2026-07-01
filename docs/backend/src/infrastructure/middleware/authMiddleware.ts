// ============================================
// AUTH MIDDLEWARE - Express Middleware
// Infrastructure Layer
// ============================================

import { Request, Response, NextFunction } from 'express';
import { SessionContext } from '../../domain/entities';

interface AuthenticatedRequest extends Request {
  sessionContext: SessionContext;
}

// Interfaz del repositorio de sesiones
interface ISesionRepository {
  findByToken(token: string): Promise<{
    id: number;
    usuarioId: number;
    dispositivoId: number;
    activa: boolean;
    usuario: {
      municipioAsignadoId: number;
      tipoVinculacion: 'EMPLEADO' | 'CONCESION';
      activo: boolean;
    };
  } | null>;
  updateUltimaActividad(id: number): Promise<void>;
}

export function createAuthMiddleware(
  sesionRepository: ISesionRepository
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Obtener token del header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token de autorización requerido',
          },
        });
      }

      const token = authHeader.substring(7);

      // 2. Validar sesión
      const sesion = await sesionRepository.findByToken(token);
      if (!sesion) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sesión inválida o expirada',
          },
        });
      }

      if (!sesion.activa) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'SESSION_EXPIRED',
            message: 'La sesión ha expirado',
          },
        });
      }

      if (!sesion.usuario.activo) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: 'Usuario inactivo',
          },
        });
      }

      // 3. Actualizar última actividad
      await sesionRepository.updateUltimaActividad(sesion.id);

      // 4. Añadir contexto de sesión al request
      const authReq = req as AuthenticatedRequest;
      authReq.sessionContext = {
        usuarioId: sesion.usuarioId,
        dispositivoId: sesion.dispositivoId,
        municipioId: sesion.usuario.municipioAsignadoId,
        tipoVinculacion: sesion.usuario.tipoVinculacion,
        sesionId: sesion.id,
      };

      next();
    } catch (error) {
      console.error('Error en middleware de autenticación:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error de autenticación',
        },
      });
    }
  };
}
