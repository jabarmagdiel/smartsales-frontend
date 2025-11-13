"use client";

import { useEffect, useState } from "react";
import { listBackups, createBackup, downloadBackup, restoreBackupFromFile, restoreBackupByName, type BackupFile } from "@/services/backupService";

export default function BackupsPage() {
  const [items, setItems] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBackups();
      setItems(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error cargando backups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const res = await createBackup();
      setInfo(res.detail + (res.file ? `: ${res.file}` : ""));
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "No se pudo crear el backup");
    }
  };

  const handleDownload = async (name: string) => {
    try {
      const blob = await downloadBackup(name);
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "No se pudo descargar");
    }
  };

  const handleRestoreName = async (name: string) => {
    try {
      await restoreBackupByName(name);
      setInfo("Restauración completada.");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "No se pudo restaurar");
    }
  };

  const handleRestoreFile = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    try {
      await restoreBackupFromFile(file);
      setInfo("Restauración completada desde archivo.");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "No se pudo restaurar");
    } finally {
      evt.target.value = "";
    }
  };

  if (loading) return <div className="p-6">Cargando backups...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Backups/Restore</h1>
        <div className="flex gap-2">
          <button onClick={handleCreate} className="bg-[#00BCD4] hover:bg-[#0097A7] text-white py-2 px-4 rounded">Backup Completo</button>
          <label className="bg-[#FF9800] hover:bg-[#FB8C00] text-white py-2 px-4 rounded cursor-pointer">
            Restaurar desde Archivo
            <input type="file" onChange={handleRestoreFile} className="hidden" accept=".zip" />
          </label>
        </div>
      </div>

      {info && <div className="p-2 bg-green-100 text-green-700 rounded border border-green-300">{info}</div>}

      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">Tamaño</th>
              <th className="text-left p-2">Modificado</th>
              <th className="text-left p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td className="p-3" colSpan={4}>No se encontraron backups</td></tr>
            )}
            {items.map((it) => (
              <tr key={it.name} className="border-t">
                <td className="p-2">{it.name}</td>
                <td className="p-2">{(it.size/1024).toFixed(1)} KB</td>
                <td className="p-2">{new Date(it.modified).toLocaleString()}</td>
                <td className="p-2 space-x-2">
                  <button onClick={() => handleDownload(it.name)} className="bg-gray-700 hover:bg-gray-800 text-white py-1 px-3 rounded">Descargar</button>
                  <button onClick={() => handleRestoreName(it.name)} className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded">Restaurar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
