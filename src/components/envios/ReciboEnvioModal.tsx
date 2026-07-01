import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EnvioDinero, ReciboEnvioDineroDTO } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Phone, 
  CheckCircle,
  DollarSign,
  MapPin,
  Bus
} from 'lucide-react';

const reciboSchema = z.object({
  receptorDocumento: z.string().min(5, 'Documento requerido').max(20),
  receptorNombre: z.string().min(3, 'Nombre requerido').max(100),
  receptorTelefono: z.string().optional(),
});

interface ReciboEnvioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  envio: EnvioDinero | null;
  onConfirm: (recibo: ReciboEnvioDineroDTO) => void;
}

export function ReciboEnvioModal({ open, onOpenChange, envio, onConfirm }: ReciboEnvioModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Omit<ReciboEnvioDineroDTO, 'envioId'>>({
    resolver: zodResolver(reciboSchema),
    defaultValues: {
      receptorDocumento: envio?.destinatario.numeroDocumento || '',
      receptorNombre: envio?.destinatario.nombreCompleto || '',
      receptorTelefono: envio?.destinatario.telefono || '',
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleFormSubmit = (data: Omit<ReciboEnvioDineroDTO, 'envioId'>) => {
    if (!envio) return;
    
    onConfirm({
      envioId: envio.id,
      ...data,
    });
    reset();
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  if (!envio) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Registrar Recibo de Dinero
          </DialogTitle>
          <DialogDescription>
            Complete los datos de quien recibe el dinero para finalizar la entrega.
          </DialogDescription>
        </DialogHeader>

        {/* Resumen del envío */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Envío:</span>
              <span className="font-bold">{envio.numeroEnvio}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Monto:
              </span>
              <span className="font-bold text-primary">{formatCurrency(envio.monto)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> Remitente:
              </span>
              <span>{envio.remitente.nombreCompleto}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Origen:
              </span>
              <span>{envio.municipioOrigen.nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Bus className="w-3 h-3" /> Transportó:
              </span>
              <span>{envio.bus.placa} - {envio.conductor.nombreCompleto}</span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-1">
                <User className="w-3 h-3" />
                Documento del Receptor
              </Label>
              <Input
                {...register('receptorDocumento')}
                placeholder="Número de documento"
                defaultValue={envio.destinatario.numeroDocumento}
              />
              {errors.receptorDocumento && (
                <p className="text-xs text-destructive mt-1">{errors.receptorDocumento.message}</p>
              )}
            </div>

            <div>
              <Label>Nombre Completo del Receptor</Label>
              <Input
                {...register('receptorNombre')}
                placeholder="Nombre de quien recibe"
                defaultValue={envio.destinatario.nombreCompleto}
              />
              {errors.receptorNombre && (
                <p className="text-xs text-destructive mt-1">{errors.receptorNombre.message}</p>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Teléfono (opcional)
              </Label>
              <Input
                {...register('receptorTelefono')}
                placeholder="Ej: 3001234567"
                defaultValue={envio.destinatario.telefono}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Confirmar Entrega
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
