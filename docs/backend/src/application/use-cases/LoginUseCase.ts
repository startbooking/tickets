// ============================================
// LOGIN USE CASE - Clean Architecture
// Application Layer
// Validaciones de ingreso de usuario
// ============================================

import {
  LoginDTO,
  SessionContext,
  Usuario,
  Dispositivo,
  SesionUsuario,
} from '../../domain/entities';

import {
  UnauthorizedError,
  DispositivoNoAsignadoError,
  SesionDuplicadaError,
} from '../../domain/errors';

// Repository Interfaces (Ports)
export interface IUsuarioRepository {
  findByEmail(email: string): Promise<Usuario | null>;
  verifyPassword(usuario: Usuario, password: string): Promise<boolean>;
}

export interface IDispositivoRepository {
  findByIdentificador(identificador: string): Promise<Dispositivo | null>;
}

export interface ISesionRepository {
  findActivaByUsuario(usuarioId: number): Promise<SesionUsuario | null>;
  create(sesion: Omit<SesionUsuario, 'id'>): Promise<SesionUsuario>;
  invalidar(id: number): Promise<void>;
  generateToken(): string;
}

// Use Case
export class LoginUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly dispositivoRepository: IDispositivoRepository,
    private readonly sesionRepository: ISesionRepository
  ) {}

  async execute(dto: LoginDTO, ipAddress?: string): Promise<{
    token: string;
    context: SessionContext;
    usuario: Usuario;
  }> {
    // 1. Validar credenciales
    const usuario = await this.usuarioRepository.findByEmail(dto.email);
    if (!usuario) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedError('Usuario inactivo');
    }

    const passwordValido = await this.usuarioRepository.verifyPassword(
      usuario,
      dto.password
    );
    if (!passwordValido) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // 2. Obtener dispositivo
    const dispositivo = await this.dispositivoRepository.findByIdentificador(
      dto.dispositivoId
    );
    if (!dispositivo) {
      throw new UnauthorizedError('Dispositivo no registrado');
    }

    if (!dispositivo.activo) {
      throw new UnauthorizedError('Dispositivo inactivo');
    }

    // VALIDACIÓN CRÍTICA 1: El dispositivo debe estar asignado al mismo municipio que el usuario
    if (dispositivo.municipioAsignadoId !== usuario.municipioAsignadoId) {
      throw new DispositivoNoAsignadoError();
    }

    // VALIDACIÓN CRÍTICA 2: El usuario no puede tener sesiones activas en otros dispositivos
    const sesionActiva = await this.sesionRepository.findActivaByUsuario(usuario.id);
    if (sesionActiva && sesionActiva.dispositivoId !== dispositivo.id) {
      throw new SesionDuplicadaError();
    }

    // Si hay sesión activa en el mismo dispositivo, la invalidamos y creamos una nueva
    if (sesionActiva) {
      await this.sesionRepository.invalidar(sesionActiva.id);
    }

    // 3. Crear nueva sesión
    const token = this.sesionRepository.generateToken();
    const nuevaSesion = await this.sesionRepository.create({
      usuarioId: usuario.id,
      dispositivoId: dispositivo.id,
      tokenSesion: token,
      ipAddress,
      activa: true,
      fechaInicio: new Date(),
      ultimaActividad: new Date(),
    });

    // 4. Retornar contexto de sesión
    const context: SessionContext = {
      usuarioId: usuario.id,
      dispositivoId: dispositivo.id,
      municipioId: usuario.municipioAsignadoId,
      tipoVinculacion: usuario.tipoVinculacion,
      sesionId: nuevaSesion.id,
    };

    return {
      token,
      context,
      usuario,
    };
  }
}
