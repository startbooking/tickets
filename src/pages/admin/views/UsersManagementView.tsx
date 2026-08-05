import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import {
  Users, Plus, Shield, Mail, Landmark, Search, RefreshCcw, Save, X, Edit,
  Lock, Unlock, Eye, EyeOff,
} from "lucide-react";
import {
  travelsoftService,
  type UsuarioSACTelConAgencia,
  type UsuarioCreateInput,
  type UsuarioUpdateInput,
  type UsuarioSACTel,
  type EstadoUsuario,
  NIVEL_USUARIO_LABEL,
} from '@/services/travelsoftService';
import { OridesOption } from '@/services/travelsoftService';

interface UsuarioFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: UsuarioCreateInput | (UsuarioUpdateInput & { cedula_usuario: string })) => Promise<void>;
  editing: UsuarioSACTelConAgencia | null;
  agencias: OridesOption[];
  loading: boolean;
}

function UsuarioForm({ open, onClose, onSave, editing, agencias, loading }: UsuarioFormProps) {
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [agencia, setAgencia] = useState<string>('');
  const [nivel, setNivel] = useState<number | ''>('');
  const [estado, setEstado] = useState<EstadoUsuario>('1');
  const [showClave, setShowClave] = useState(false);

  useEffect(() => {
    if (editing) {
      setCedula(editing.cedula_usuario);
      setNombre(editing.nombre_usuario);
      setClave(editing.clave_usuario);
      setAgencia(String(editing.id_orides));
      setNivel(editing.nivel_usuario);
      setEstado(editing.estado_usuario);
    } else {
      setCedula('');
      setNombre('');
      setClave('');
      setAgencia(String(agencias[0]?.id_orides ?? ''));
      setNivel(2);
      setEstado('1');
    }
  }, [editing, agencias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim() || !nombre.trim() || !clave.trim() || !agencia || nivel === '') return;

    const base = {
      cedula_usuario: cedula,
      nombre_usuario: nombre,
      clave_usuario: clave,
      id_orides: Number(agencia),
      nivel_usuario: Number(nivel),
      estado_usuario: estado,
    };

    if (editing) {
      await onSave({ cedula_usuario: cedula, ...base });
    } else {
      await onSave(base);
    }
  };

  const isNuevo = !editing;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNuevo ? 'Crear Nuevo Usuario' : 'Editar Usuario'}</DialogTitle>
          <DialogDescription>
            {isNuevo ? 'Registra un nuevo usuario en el sistema.' : 'Modifica los datos del usuario.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="cedula">Cédula</Label>
            <Input
              id="cedula"
              placeholder="100.000.001"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              disabled={loading || !isNuevo}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              placeholder="JUAN PEREZ RODRIGUEZ"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clave">Contraseña</Label>
            <div className="relative">
              <Input
                id="clave"
                type={showClave ? "text" : "password"}
                placeholder="••••••••"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                onClick={() => setShowClave(!showClave)}
              >
                {showClave ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agencia">Agencia</Label>
            <Select value={agencia} onValueChange={setAgencia} disabled={loading}>
              <SelectTrigger id="agencia">
                <SelectValue placeholder="Selecciona una agencia" />
              </SelectTrigger>
              <SelectContent>
                {agencias.map((a) => (
                  <SelectItem key={a.id_orides} value={String(a.id_orides)}>
                    {a.desc_orides || String(a.id_orides)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nivel">Nivel / Rol</Label>
            <Select value={String(nivel)} onValueChange={(v) => setNivel(Number(v))} disabled={loading}>
              <SelectTrigger id="nivel">
                <SelectValue placeholder="Selecciona un nivel" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NIVEL_USUARIO_LABEL).map(([n, label]) => (
                  <SelectItem key={n} value={n}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={estado} onValueChange={(v) => setEstado(v as EstadoUsuario)} disabled={loading}>
              <SelectTrigger id="estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Activo</SelectItem>
                <SelectItem value="0">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <RefreshCcw className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              {isNuevo ? 'Crear' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CambiarClaveProps {
  open: boolean;
  onClose: () => void;
  usuario: UsuarioSACTelConAgencia;
  onSave: (nuevaClave: string) => Promise<void>;
  loading: boolean;
}

function CambiarClaveDialog({ open, onClose, usuario, onSave, loading }: CambiarClaveProps) {
  const [clave, setClave] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showClave, setShowClave] = useState(false);

  useEffect(() => {
    setClave('');
    setConfirmar('');
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clave || clave !== confirmar) {
      toast.error('Las contraseñas no coinciden o están vacías.');
      return;
    }
    if (clave.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    await onSave(clave);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Nueva contraseña para <strong>{usuario.nombre_usuario}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="nueva-clave">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="nueva-clave"
                type={showClave ? "text" : "password"}
                placeholder="••••••••"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                onClick={() => setShowClave(!showClave)}
              >
                {showClave ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar-clave">Confirmar Contraseña</Label>
            <Input
              id="confirmar-clave"
              type={showClave ? "text" : "password"}
              placeholder="••••&&&&"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <RefreshCcw className="w-4 h-4 animate-spin mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersManagementView() {
  const [usuarios, setUsuarios] = useState<UsuarioSACTelConAgencia[]>([]);
  const [agencias, setAgencias] = useState<OridesOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Diálogos
  const [formOpen, setFormOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioSACTelConAgencia | null>(null);
  const [claveOpen, setClaveOpen] = useState(false);
  const [claveUsuario, setClaveUsuario] = useState<UsuarioSACTelConAgencia | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockingUsuario, setBlockingUsuario] = useState<UsuarioSACTelConAgencia | null>(null);

  // ── Carga de datos ────────────────────────────────────────────────────────────
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [u, a] = await Promise.all([
        travelsoftService.getUsuarios(),
        travelsoftService.getOrides(),
      ]);
      setUsuarios(u);
      setAgencias(a);
    } catch (err) {
      toast.error('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  // ── CRUD handlers ─────────────────────────────────────────────────────────────

  const handleGuardarUsuario = async (
    data: UsuarioCreateInput | (UsuarioUpdateInput & { cedula_usuario: string })
  ) => {
    try {
      if (editingUsuario) {
        await travelsoftService.actualizarUsuario(editingUsuario.cedula_usuario, data as UsuarioUpdateInput);
        toast.success('Usuario actualizado correctamente.');
      } else {
        await travelsoftService.crearUsuario(data as UsuarioCreateInput);
        toast.success('Usuario creado correctamente.');
      }
      void cargarDatos();
      setFormOpen(false);
      setEditingUsuario(null);
    } catch (err) {
      toast.error('No se pudo guardar el usuario.');
    }
  };

  const handleCambiarClave = async (nuevaClave: string) => {
    if (!claveUsuario) return;
    try {
      await travelsoftService.cambiarClaveUsuario(claveUsuario.cedula_usuario, nuevaClave);
      toast.success('Contraseña actualizada.');
      setClaveOpen(false);
      setClaveUsuario(null);
    } catch (err) {
      toast.error('No se pudo cambiar la contraseña.');
    }
  };

  const handleToggleBloqueado = async () => {
    if (!blockingUsuario) return;
    const nuevoEstado: EstadoUsuario = blockingUsuario.estado_usuario === '1' ? '0' : '1';
    try {
      await travelsoftService.toggleUsuarioBloqueado(blockingUsuario.cedula_usuario, nuevoEstado);
      const accion = nuevoEstado === '0' ? 'bloqueado' : 'desbloqueado';
      toast.success(`Usuario ${accion} correctamente.`);
      void cargarDatos();
      setBlockOpen(false);
      setBlockingUsuario(null);
    } catch (err) {
      toast.error('No se pudo cambiar el estado del usuario.');
    }
  };

  // ── Filtros ───────────────────────────────────────────────────────────────────
  const usuariosFiltrados = usuarios.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.cedula_usuario.toLowerCase().includes(term) ||
      u.nombre_usuario.toLowerCase().includes(term) ||
      (u.agencia || '').toLowerCase().includes(term)
    );
  });

  const rolLabel = (u: UsuarioSACTelConAgencia): string => {
    return NIVEL_USUARIO_LABEL[u.nivel_usuario] || String(u.nivel_usuario);
  };

  return (
    <Card className="shadow-sm border-slate-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Control de Usuarios y Taquilleros
          </CardTitle>
          <CardDescription className="mt-1">
            Administra usuarios, roles, claves y estado de acceso del sistema.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por cédula, nombre o agencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-56 h-9 text-sm"
            />
          </div>
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => { setEditingUsuario(null); setFormOpen(true); }}
          >
            <Plus className="w-4 h-4" /> Registrar Usuario
          </Button>
          <Button variant="outline" size="sm" onClick={cargarDatos} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                <th className="p-3 rounded-l-lg">Cédula</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Agencia</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right rounded-r-lg">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {usuariosFiltrados.map((u) => {
                const estaBloqueado = u.estado_usuario === '0';
                return (
                  <tr key={u.cedula_usuario} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono text-xs text-slate-600">{u.cedula_usuario}</td>
                    <td className="p-3 font-semibold text-slate-900">{u.nombre_usuario}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        <Shield className="w-3 h-3" /> {rolLabel(u)}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-slate-400" />
                        {u.agencia || String(u.id_orides)}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        estaBloqueado
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {estaBloqueado ? 'Bloqueado' : 'Activo'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="sm"
                          title={estaBloqueado ? 'Desbloquear' : 'Bloquear'}
                          onClick={() => { setBlockingUsuario(u); setBlockOpen(true); }}
                          className={estaBloqueado ? 'text-emerald-600 hover:bg-emerald-50' : 'text-orange-600 hover:bg-orange-50'}
                        >
                          {estaBloqueado ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          title="Cambiar contraseña"
                          onClick={() => { setClaveUsuario(u); setClaveOpen(true); }}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Lock className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          title="Editar"
                          onClick={() => { setEditingUsuario(u); setFormOpen(true); }}
                          className="text-slate-600 hover:bg-slate-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Formulario de crear/editar */}
      <UsuarioForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingUsuario(null); }}
        onSave={handleGuardarUsuario}
        editing={editingUsuario}
        agencias={agencias}
        loading={loading}
      />

      {/* Diálogo de cambio de contraseña */}
      {claveUsuario && (
        <CambiarClaveDialog
          open={claveOpen}
          onClose={() => { setClaveOpen(false); setClaveUsuario(null); }}
          usuario={claveUsuario}
          onSave={handleCambiarClave}
          loading={loading}
        />
      )}

      {/* Diálogo de confirmación de bloqueo/desbloqueo */}
      {blockingUsuario && (
        <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {blockingUsuario.estado_usuario === '1' ? '¿Bloquear' : '¿Desbloquear'} usuario?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {blockingUsuario.estado_usuario === '1'
                  ? `El usuario ${blockingUsuario.nombre_usuario} (${blockingUsuario.cedula_usuario}) será bloqueado y no podrá iniciar sesión.`
                  : `El usuario ${blockingUsuario.nombre_usuario} (${blockingUsuario.cedula_usuario}) será desbloqueado y podrá iniciar sesión.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleBloqueado}
                className={blockingUsuario.estado_usuario === '1' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'}
              >
                {blockingUsuario.estado_usuario === '1' ? 'Bloquear' : 'Desbloquear'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
