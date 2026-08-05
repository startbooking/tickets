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
import { toast } from "sonner";
import {
  UserSquare2, Plus, Search, RefreshCcw, Save, X, Edit, Lock, Unlock, Phone, Mail,
} from "lucide-react";
import {
  travelsoftService,
  type ConductorSACTel,
  type ConductorCreateInput,
  type ConductorUpdateInput,
} from '@/services/travelsoftService';
import { usePagination } from '@/hooks/usePagination';
import { PaginationBar } from "@/components/PaginationBar";

interface ConductorFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ConductorCreateInput) => Promise<void>;
  editing: ConductorSACTel | null;
  loading: boolean;
}

function ConductorForm({ open, onClose, onSave, editing, loading }: ConductorFormProps) {
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [celular, setCelular] = useState('');
  const [correo, setCorreo] = useState('');
  const [estado, setEstado] = useState<'1' | '0'>('1');

  useEffect(() => {
    if (editing) {
      setCedula(editing.cedula_conduc || '');
      setNombre(editing.nombre_conduc || '');
      setTelefono(editing.telefono_conduc || '');
      setCelular(editing.celular_conduc || '');
      setCorreo(editing.correo_conduc || '');
      setEstado((editing.estado_conduc as '1' | '0') || '1');
    } else {
      setCedula('');
      setNombre('');
      setTelefono('');
      setCelular('');
      setCorreo('');
      setEstado('1');
    }
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim()) {
      toast.error('La cédula es obligatoria.');
      return;
    }
    if (!nombre.trim()) {
      toast.error('El nombre del conductor es obligatorio.');
      return;
    }

    const data: ConductorCreateInput = {
      cedula_conduc: cedula.trim(),
      nombre_conduc: nombre.trim(),
      telefono_conduc: telefono.trim() || undefined,
      celular_conduc: celular.trim() || undefined,
      correo_conduc: correo.trim() || undefined,
      estado_conduc: estado,
    };

    await onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Conductor' : 'Registrar Nuevo Conductor'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Modifica los datos del conductor.' : 'Registra un nuevo conductor u operador en el sistema.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="cedula">Cédula</Label>
            <Input
              id="cedula"
              placeholder="1030529XX"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              disabled={loading || !!editing}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              placeholder="APELLIDOS NOMBRES"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono Fijo</Label>
            <Input
              id="telefono"
              placeholder="601XXXXXXX"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="celular">Celular</Label>
            <Input
              id="celular"
              placeholder="3XXXXXXXXX"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="correo">Correo Electrónico</Label>
            <Input
              id="correo"
              type="email"
              placeholder="correo@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={estado} onValueChange={(v) => setEstado(v as '1' | '0')} disabled={loading}>
              <SelectTrigger id="estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Activo</SelectItem>
                <SelectItem value="0">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <RefreshCcw className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DriversManagementView() {
  const [conductores, setConductores] = useState<ConductorSACTel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingConductor, setEditingConductor] = useState<ConductorSACTel | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockingConductor, setBlockingConductor] = useState<ConductorSACTel | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await travelsoftService.getFlotaConductores();
      setConductores(data);
    } catch (err) {
      toast.error('No se pudieron cargar los conductores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  const handleGuardarConductor = async (data: ConductorCreateInput) => {
    try {
      if (editingConductor) {
        const input: ConductorUpdateInput = {
          nombre_conduc: data.nombre_conduc,
          telefono_conduc: data.telefono_conduc,
          celular_conduc: data.celular_conduc,
          correo_conduc: data.correo_conduc,
          estado_conduc: data.estado_conduc,
        };
        await travelsoftService.actualizarConductor(editingConductor.cedula_conduc, input);
        toast.success('Conductor actualizado correctamente.');
      } else {
        await travelsoftService.crearConductor(data);
        toast.success('Conductor creado correctamente.');
      }
      void cargarDatos();
      setFormOpen(false);
      setEditingConductor(null);
    } catch (err) {
      toast.error('No se pudo guardar el conductor.');
    }
  };

  const handleToggleBloqueado = async () => {
    if (!blockingConductor) return;
    const estaBloqueado = blockingConductor.estado_conduc === '0';
    try {
      await travelsoftService.toggleConductorBloqueado(
        blockingConductor.cedula_conduc,
        !estaBloqueado
      );
      const accion = estaBloqueado ? 'desbloqueado' : 'bloqueado';
      toast.success(`Conductor ${accion} correctamente.`);
      void cargarDatos();
      setBlockOpen(false);
      setBlockingConductor(null);
    } catch (err) {
      toast.error('No se pudo cambiar el estado del conductor.');
    }
  };

  const conductoresFiltrados = conductores.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.cedula_conduc || '').toLowerCase().includes(term) ||
      (c.nombre_conduc || '').toLowerCase().includes(term) ||
      (c.celular_conduc || '').toLowerCase().includes(term)
    );
  });

  const { paginatedItems, currentPage, totalPages, pageSize, setPageSize, goToPage, nextPage, prevPage, goToFirst, goToLast } =
    usePagination<ConductorSACTel>(conductoresFiltrados, 25);

  const estadoLabel = (c: ConductorSACTel): string => {
    if (c.estado_conduc === '0') return 'Bloqueado';
    return 'Activo';
  };

  const estadoClass = (c: ConductorSACTel): string => {
    if (c.estado_conduc === '0') return 'bg-orange-100 text-orange-800';
    return 'bg-emerald-100 text-emerald-800';
  };

  return (
    <Card className="shadow-sm border-slate-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-xl flex items-center gap-2">
            <UserSquare2 className="w-5 h-5 text-blue-600" />
            Maestro de Conductores / Operadores
          </CardTitle>
          <CardDescription className="mt-1">
            Registro de conductores y operadores, datos de contacto, estado y bloqueo de despacho.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por cédula, nombre o celular..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-56 h-9 text-sm"
            />
          </div>
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => { setEditingConductor(null); setFormOpen(true); }}
          >
            <Plus className="w-4 h-4" /> Registrar Conductor
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
                <th className="p-3">Conductor</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Celular</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right rounded-r-lg">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {paginatedItems.map((c) => {
                const bloqueado = c.estado_conduc === '0';
                return (
                  <tr key={c.cedula_conduc} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">{c.cedula_conduc}</td>
                    <td className="p-3 font-semibold text-slate-900">{c.nombre_conduc || '—'}</td>
                    <td className="p-3 text-slate-600">
                      {c.telefono_conduc ? <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {c.telefono_conduc}</span> : '—'}
                    </td>
                    <td className="p-3 text-slate-600">{c.celular_conduc || '—'}</td>
                    <td className="p-3 text-slate-600">
                      {c.correo_conduc ? <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {c.correo_conduc}</span> : '—'}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${estadoClass(c)}`}>
                        {estadoLabel(c)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="sm"
                          title={bloqueado ? 'Desbloquear' : 'Bloquear'}
                          onClick={() => { setBlockingConductor(c); setBlockOpen(true); }}
                          className={bloqueado ? 'text-emerald-600 hover:bg-emerald-50' : 'text-orange-600 hover:bg-orange-50'}
                        >
                          {bloqueado ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          title="Editar"
                          onClick={() => { setEditingConductor(c); setFormOpen(true); }}
                          className="text-slate-600 hover:bg-slate-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No se encontraron conductores.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={conductoresFiltrados.length}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onGoToPage={goToPage}
          onPrevPage={prevPage}
          onNextPage={nextPage}
          onGoToFirst={goToFirst}
          onGoToLast={goToLast}
        />
      </CardContent>

      {/* Formulario de crear/editar */}
      <ConductorForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingConductor(null); }}
        onSave={handleGuardarConductor}
        editing={editingConductor}
        loading={loading}
      />

      {/* Diálogo de confirmación de bloqueo/desbloqueo */}
      {blockingConductor && (
        <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {blockingConductor.estado_conduc === '0' ? '¿Desbloquear' : '¿Bloquear'} conductor?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {blockingConductor.estado_conduc === '0'
                  ? `El conductor ${blockingConductor.nombre_conduc} será desbloqueado y podrá ser asignado nuevamente a rutas.`
                  : `El conductor ${blockingConductor.nombre_conduc} será bloqueado y no podrá ser asignado a rutas hasta que sea desbloqueado.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleBloqueado}
                className={blockingConductor.estado_conduc === '0' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'}
              >
                {blockingConductor.estado_conduc === '0' ? 'Desbloquear' : 'Bloquear'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}