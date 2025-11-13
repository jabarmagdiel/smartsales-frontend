"use client";

import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";

interface LogEntry {
  id: number;
  user: { id: number; username: string } | null;
  ip_address: string;
  action: string;
  timestamp: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<{ results?: LogEntry[] }>("/admin/logs/");
        const list = (res.data as any).results ?? (res.data as any);
        setLogs(list);
      } catch (e: any) {
        setError(e?.response?.data?.detail || "Error cargando bitácora");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6">Cargando bitácora...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Bitácora (Admin)</h1>
      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">Usuario</th>
              <th className="text-left p-2">IP</th>
              <th className="text-left p-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td className="p-3" colSpan={4}>Sin registros</td></tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2">{new Date(l.timestamp).toLocaleString()}</td>
                <td className="p-2">{l.user?.username || "-"}</td>
                <td className="p-2">{l.ip_address}</td>
                <td className="p-2">{l.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
