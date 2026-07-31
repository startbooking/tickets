import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, UserCheck, UserX } from "lucide-react";

export function LocalUsersView({ idAgencia }: { idAgencia: number }) {
  const localStaff = [
    { id: 10, name: "Carlos Mendoza", rol: "CAJERO", activo: true },
    { id: 11, name: "Yusneidy Delgado", rol: "DESPACHADOR", activo: true },
    { id: 12, name: "Mauricio Restrepo", rol: "CAJERO", activo: false },
  ];

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Personal de la Agencia</CardTitle>
          <CardDescription>Crea y gestiona taquilleros y operadores vinculados únicamente a esta terminal.</CardDescription>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Nuevo Operador Local
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="divide-y border rounded-xl bg-white overflow-hidden">
          {localStaff.map(staff => (
            <div key={staff.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{staff.name}</h4>
                <p className="text-xs text-slate-500">ID Usuario: #{staff.id} • Rol: <span className="font-mono bg-slate-100 px-1 rounded">{staff.rol}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${staff.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {staff.activo ? "Activo" : "Inactivo"}
                </span>
                <Button variant="outline" size="sm" className={staff.activo ? "text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"}>
                  {staff.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}