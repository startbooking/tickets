// ============================================
// TICKET ROUTES - Express Router
// Infrastructure Layer
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { CreateTicketUseCase } from '../../application/use-cases/CreateTicketUseCase';
import { CreateTicketDTO, SessionContext } from '../../domain/entities';
import { DomainError } from '../../domain/errors';

// Middleware para obtener contexto de sesión
interface AuthenticatedRequest extends Request {
  sessionContext: SessionContext;
}

export function createTicketRoutes(
  createTicketUseCase: CreateTicketUseCase,
  authMiddleware: (req: Request, res: Response, next: NextFunction) => void
): Router {
  const router = Router();

  /**
   * POST /api/tickets
   * Crear un nuevo ticket
   * 
   * Body:
   * {
   *   planillaDespachoId: number,
   *   pasajeroId: number,
   *   rutaId: number,
   *   numeroAsiento?: number,
   *   valorPagado: number,
   *   formaPago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'QR',
   *   observaciones?: string
   * }
   */
  router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const dto: CreateTicketDTO = {
        planillaDespachoId: req.body.planillaDespachoId,
        pasajeroId: req.body.pasajeroId,
        rutaId: req.body.rutaId,
        numeroAsiento: req.body.numeroAsiento,
        valorPagado: parseFloat(req.body.valorPagado),
        formaPago: req.body.formaPago,
        observaciones: req.body.observaciones,
      };

      // Validaciones básicas
      if (!dto.planillaDespachoId || !dto.pasajeroId || !dto.rutaId || !dto.valorPagado) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Faltan campos requeridos: planillaDespachoId, pasajeroId, rutaId, valorPagado',
          },
        });
      }

      const ticket = await createTicketUseCase.execute(dto, authReq.sessionContext);

      return res.status(201).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }

      console.error('Error al crear ticket:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  });

  /**
   * GET /api/tickets/:id
   * Obtener ticket por ID
   */
  router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
      // Implementar lógica de obtención
      return res.status(200).json({
        success: true,
        data: null, // TODO: Implementar
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  });

  /**
   * GET /api/tickets/planilla/:planillaId
   * Obtener tickets por planilla
   */
  router.get('/planilla/:planillaId', authMiddleware, async (req: Request, res: Response) => {
    try {
      // Implementar lógica de obtención
      return res.status(200).json({
        success: true,
        data: [], // TODO: Implementar
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  });

  /**
   * PATCH /api/tickets/:id/cancel
   * Cancelar un ticket
   */
  router.patch('/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
    try {
      // Implementar lógica de cancelación
      return res.status(200).json({
        success: true,
        message: 'Ticket cancelado',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  });

  return router;
}
