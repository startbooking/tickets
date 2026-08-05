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
  Bus, Plus, Armchair, Search, RefreshCcw, Save, X, Edit, Lock, Unlock,
} from "lucide-react";
import {
  travelsoftService,
  type VehiculoSACTel,
  type VehiculoCreateInput,
  type VehiculoUpdateInput,
} from '@/services/travelsoftService';
import { usePagination } from '@/hooks/usePagination';
import { PaginationBar } from "@/components/PaginationBar";

interface VehiculoFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: VehiculoCreateInput) => Promise<void>;
  editing: VehiculoSACTel | null;
  loading: boolean;
}

function VehiculoForm({ open, onClose, onSave, editing, loading }: VehiculoFormProps) {
  const [placa, setPlaca] = useState('');
  const [orden, setOrden] = useState('');
  const [modelo, setModelo] = useState<string>('');
  const [marca, setMarca] = useState('');
  const [capacidad, setCapacidad] = useState<string>('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState<'1' | '0'>('1');

  useEffect(() => {
    if (editing) {
      setPlaca(editing.placa_vehi || '');
      setOrden(editing.orden_vehi || '');
      setModelo(editing.modelo_vehi ? String(editing.modelo_vehi) : '');
      setMarca(editing.marca_vehi || '');
      setCapacidad(editing.pasajeros_vehi ? String(editing.pasajeros_vehi) : '');
      setTipo(editing.tipo_vehi || '');
      setEstado((editing.estado_vehi as '1' | '0') || '1');
    } else {
      setPlaca('');
      setOrden('');
      setModelo('');
      setMarca('');
      setCapacidad('');
      setTipo('');
      setEstado('1');
    }
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa.trim()) {
      toast.error('La placa es obligatoria.');
      return;
    }
    if (!orden.trim()) {
      toast.error('El número interno es obligatorio.');
      return;
    }

    const data: VehiculoCreateInput = {
      placa_vehi: placa.trim(),
      orden_vehi: orden.trim() || undefined,
      modelo_vehi: modelo ? Number(modelo) : undefined,
      marca_vehi: marca || undefined,
      pasajeros_vehi: capacidad ? Number(capacidad) : undefined,
      tipo_vehi: tipo || undefined,
      estado_vehi: estado,
      bloqueo_vehi: editing ? editing.bloqueo_vehi : '0',
    };

    await onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Vehículo' : 'Vincular Nuevo Vehículo'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Modifica los datos del vehículo.' : 'Registra un nuevo bus en el sistema.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="placa">Placa</Label>
            <Input
              id="placa"
              placeholder="ABC-123"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              disabled={loading || !!editing}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orden">Número Interno</Label>
            <Input
              id="orden"
              placeholder="1024"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo</Label>
            <Input
              id="modelo"
              type="number"
              placeholder="2023"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              placeholder="Volvo / Mercedes / etc."
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacidad">Capacidad (sillas)</Label>
            <Input
              id="capacidad"
              type="number"
              placeholder="32"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Vehículo</Label>
            <Input
              id="tipo"
              placeholder="Piso y Medio / Doble Piso / TV"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
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

export function BusesManagementView() {
  const [vehiculos, setVehiculos] = useState<VehiculoSACTel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<VehiculoSACTel | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockingVehiculo, setBlockingVehiculo] = useState<VehiculoSACTel | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await travelsoftService.getFlotaVehiculos();
      setVehiculos(data);
    } catch (err) {
      toast.error('No se pudieron cargar los vehículos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  const handleGuardarVehiculo = async (data: VehiculoCreateInput) => {
    try {
      if (editingVehiculo) {
        const input: VehiculoUpdateInput = {
          orden_vehi: data.orden_vehi,
          modelo_vehi: data.modelo_vehi,
          marca_vehi: data.marca_vehi,
          pasajeros_vehi: data.pasajeros_vehi,
          tipo_vehi: data.tipo_vehi,
          estado_vehi: data.estado_vehi,
        };
        await travelsoftService.actualizarVehiculo(editingVehiculo.placa_vehi, input);
        toast.success('Vehículo actualizado correctamente.');
      } else {
        await travelsoftService.crearVehiculo(data);
        toast.success('Vehículo creado correctamente.');
      }
      void cargarDatos();
      setFormOpen(false);
      setEditingVehiculo(null);
    } catch (err) {
      toast.error('No se pudo guardar el vehículo.');
    }
  };

  const handleToggleBloqueado = async () => {
    if (!blockingVehiculo) return;
    const estaBloqueado = blockingVehiculo.bloqueo_vehi === '1';
    try {
      await travelsoftService.toggleVehiculoBloqueado(
        blockingVehiculo.placa_vehi,
        !estaBloqueado,
        estaBloqueado ? '' : 'Bloqueado desde el panel de administración'
      );
      const accion = estaBloqueado ? 'desbloqueado' : 'bloqueado';
      toast.success(`Vehículo ${accion} correctamente.`);
      void cargarDatos();
      setBlockOpen(false);
      setBlockingVehiculo(null);
    } catch (err) {
      toast.error('No se pudo cambiar el estado del vehículo.');
    }
  };

  const vehiculosFiltrados = vehiculos.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      (v.placa_vehi || '').toLowerCase().includes(term) ||
      (v.orden_vehi || '').toLowerCase().includes(term) ||
      (v.marca_vehi || '').toLowerCase().includes(term)
    );
  });

  const { paginatedItems, currentPage, totalPages, pageSize, setPageSize, goToPage, nextPage, prevPage, goToFirst, goToLast } =
    usePagination<VehiculoSACTel>(vehiculosFiltrados, 25);

  const estadoLabel = (v: VehiculoSACTel): string => {
    if (v.estado_vehi !== '1') return 'Inactivo';
    if (v.bloqueo_vehi === '1') return 'Bloqueado';
    return 'Operativo';
  };

  const estadoClass = (v: VehiculoSACTel): string => {
    if (v.estado_vehi !== '1') return 'bg-red-100 text-red-800';
    if (v.bloqueo_vehi === '1') return 'bg-orange-100 text-orange-800';
    return 'bg-emerald-100 text-emerald-800';
  };

  return (
    <Card className="shadow-sm border-slate-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-xl flex items-center gap-2">
            <Bus className="w-5 h-5 text-blue-600" />
            Flota de Vehículos (Buses)
          </CardTitle>
          <CardDescription className="mt-1">
            Vinculación de vehículos, auditoría de capacidad física, bloqueo y asignación de conductores.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por placa, número o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-56 h-9 text-sm"
            />
          </div>
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => { setEditingVehiculo(null); setFormOpen(true); }}
          >
            <Plus className="w-4 h-4" /> Vincular Vehículo
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
                <th className="p-3 rounded-l-lg">Placa</th>
                <th className="p-3">Número Interno</th>
                <th className="p-3">Marca / Modelo</th>
                <th className="p-3">Capacidad</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right rounded-r-lg">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {paginatedItems.map((v) => {
                const bloqueado = v.bloqueo_vehi === '1';
                return (
                  <tr key={v.placa_vehi} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-sm tracking-wider shadow-sm border border-amber-500">
                        {v.placa_vehi}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{v.orden_vehi || '—'}</td>
                    <td className="p-3 text-slate-600">{v.marca_vehi || '—'}{v.modelo_vehi ? ` / ${v.modelo_vehi}` : ''}</td>
                    <td className="p-3 text-slate-600">
                      <div className="flex items-center gap-1"><Armchair className="w-3.5 h-3.5" /> {v.pasajeros_vehi || 0} sillas</div>
                    </td>
                    <td className="p-3 text-slate-600">{v.tipo_vehi || '—'}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${estadoClass(v)}`}>
                        {estadoLabel(v)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="sm"
                          title={bloqueado ? 'Desbloquear' : 'Bloquear'}
                          onClick={() => { setBlockingVehiculo(v); setBlockOpen(true); }}
                          className={bloqueado ? 'text-emerald-600 hover:bg-emerald-50' : 'text-orange-600 hover:bg-orange-50'}
                        >
                          {bloqueado ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          title="Editar"
                          onClick={() => { setEditingVehiculo(v); setFormOpen(true); }}
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
                    No se encontraron vehículos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={vehiculosFiltrados.length}
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
      <VehiculoForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingVehiculo(null); }}
        onSave={handleGuardarVehiculo}
        editing={editingVehiculo}
        loading={loading}
      />

      {/* Diálogo de confirmación de bloqueo/desbloqueo */}
      {blockingVehiculo && (
        <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {blockingVehiculo.bloqueo_vehi === '1' ? '¿Desbloquear' : '¿Bloquear'} vehículo?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {blockingVehiculo.bloqueo_vehi === '1'
                  ? `El vehículo ${blockingVehiculo.placa_vehi} será desbloqueado y podrá ser despachado nuevamente.`
                  : `El vehículo ${blockingVehiculo.placa_vehi} será bloqueado y no podrá ser despachado hasta que sea desbloqueado.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleBloqueado}
                className={blockingVehiculo.bloqueo_vehi === '1' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'}
              >
                {blockingVehiculo.bloqueo_vehi === '1' ? 'Desbloquear' : 'Bloquear'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
