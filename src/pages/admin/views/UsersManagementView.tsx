import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Shield, Mail, Landmark } from "lucide-react";

export function UsersManagementView() {
  // Simulación de datos para la grilla
  const mockUsers = [
    { id: 1, name: "Rafael Barahona", email: "rafael@sactel.cloud", role: "SUPERADMIN", agency: "Central Sactel" },
    { id: 2, name: "Carlos Mendoza", email: "carlos.m@sactel.lan", role: "TAQUILLERO", agency: "Terminal Salitre" },
    { id: 3, name: "Luz Karime", email: "luz.k@sactel.lan", role: "TAQUILLERO", agency: "Terminal Villavicencio" }
  ];

  return (
    <Card className="shadow-sm border-slate-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Control de Usuarios y Taquilleros
          </CardTitle>
          <CardDescription className="mt-1">Administra los permisos de acceso y asigna cajeros a las terminales físicas.</CardDescription>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Registrar Usuario
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                <th className="p-3">Nombre / Funcionario</th>
                <th className="p-3">Correo Electrónico</th>
                <th className="p-3">Rol / Permisos</th>
                <th className="p-3">Agencia Asignada</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {mockUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="p-3 text-slate-600">
                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {u.email}</div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      <Shield className="w-3 h-3" /> {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">
                    <div className="flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5 text-slate-400" /> {u.agency}</div>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">Editar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}