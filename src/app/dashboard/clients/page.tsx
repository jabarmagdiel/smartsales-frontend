"use client";

import { useEffect, useState } from "react";
import { getClients, createClient, updateClient, deleteClient, toggleClientActive, type Client } from "@/services/clientService";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{ id?: number; username: string; email?: string; first_name?: string; last_name?: string; password?: string }>({ username: "" });

  const load = async () => {
    setLoading(true);
    try {
      const list = await getClients();
      setClients(list);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error cargando clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ username: "" }); setModalOpen(true); };
  const openEdit = (c: Client) => { setForm({ id: c.id, username: c.username, email: c.email, first_name: c.first_name, last_name: c.last_name }); setModalOpen(true); };

  const save = async () => {
    try {
      if (!form.username.trim()) { setError("Username requerido"); return; }
      if (form.id) {
        await updateClient(form.id, { username: form.username, email: form.email, first_name: form.first_name, last_name: form.last_name });
        setInfo("Cliente actualizado");
      } else {
        await createClient({ username: form.username, email: form.email, first_name: form.first_name, last_name: form.last_name, password: form.password || "123456", role: 'CLIENT', is_active: true });
        setInfo("Cliente creado");
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "No se pudo guardar");
    }
  };

  const toggleActive = async (c: Client) => {
    try {
      await toggleClientActive(c.id, !c.is_active);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "No se pudo cambiar estado");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("¿Eliminar cliente?")) return;
    try {
      await deleteClient(id);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "No se pudo eliminar");
    }
  };

  if (loading) return <div className="p-6">Cargando clientes...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button onClick={openCreate} className="bg-[#00BCD4] hover:bg-[#0097A7] text-white py-2 px-4 rounded">Nuevo Cliente</button>
      </div>
      {info && <div className="p-2 bg-green-100 text-green-700 rounded border border-green-300">{info}</div>}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Usuario</th>
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Rol</th>
              <th className="text-left p-2">Estado</th>
              <th className="text-left p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr><td className="p-3" colSpan={6}>Sin clientes</td></tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.username}</td>
                <td className="p-2">{[c.first_name, c.last_name].filter(Boolean).join(" ")}</td>
                <td className="p-2">{c.email || "-"}</td>
                <td className="p-2">{c.role}</td>
                <td className="p-2">{c.is_active ? "Activo" : "Inactivo"}</td>
                <td className="p-2 space-x-2">
                  <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => toggleActive(c)} className="text-amber-600 hover:underline">{c.is_active ? "Desactivar" : "Activar"}</button>
                  <button onClick={() => remove(c.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded shadow w-full max-w-lg p-4 space-y-3">
            <h2 className="font-semibold text-lg">{form.id ? "Editar Cliente" : "Nuevo Cliente"}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm text-gray-600">Usuario</label>
                <input className="mt-1 w-full border rounded p-2 text-gray-900" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Nombre</label>
                <input className="mt-1 w-full border rounded p-2 text-gray-900" value={form.first_name || ""} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Apellido</label>
                <input className="mt-1 w-full border rounded p-2 text-gray-900" value={form.last_name || ""} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-600">Email</label>
                <input className="mt-1 w-full border rounded p-2 text-gray-900" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              {!form.id && (
                <div className="col-span-2">
                  <label className="text-sm text-gray-600">Contraseña</label>
                  <input type="password" className="mt-1 w-full border rounded p-2 text-gray-900" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="123456" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded border">Cancelar</button>
              <button onClick={save} className="px-4 py-2 rounded text-white bg-[#00BCD4] hover:bg-[#0097A7]">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
