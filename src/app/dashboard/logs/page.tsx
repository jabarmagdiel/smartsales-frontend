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

export default function DashboardLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userQ, setUserQ] = useState("");
  const [actionQ, setActionQ] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const fetchLogs = async (params?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams(params || {}).toString();
      const url = qs ? `/admin/logs/?${qs}` : "/admin/logs/";
      const res = await apiClient.get<{ results?: LogEntry[] }>(url);
      const list = (res.data as any).results ?? (res.data as any);
      setLogs(list);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Error al cargar los logs");
    } finally {
      setLoading(false);
    }
  };

  const downloadLogs = async (format: 'pdf' | 'xlsx') => {
    setDownloadingFormat(format);
    setError(null);
    
    try {
      const params = {
        user_query: userQ,
        action_query: actionQ,
        start_date: startDate,
        end_date: endDate,
        format: format
      };
      
      const response = await apiClient.get('/admin/logs/export/', {
        params,
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bitacora_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(`📄 Bitácora descargada en formato ${format.toUpperCase()}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || `Error al descargar ${format.toUpperCase()}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (userQ.trim()) params.user = userQ.trim();
    if (actionQ.trim()) params.action = actionQ.trim();
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    fetchLogs(params);
  };

  if (loading) return <div className="p-6">Cargando bitácora...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00BCD4] to-[#0097A7] text-white p-6 mb-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-2">📋 Bitácora del Sistema</h1>
          <p className="text-lg opacity-90">Registro completo de actividades y eventos del sistema</p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        {/* Filtros */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">🔍 Filtros de Búsqueda</h2>
            <div className="flex gap-3">
              <button
                onClick={() => downloadLogs('pdf')}
                disabled={downloadingFormat === 'pdf' || logs.length === 0}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {downloadingFormat === 'pdf' ? '⏳ Descargando...' : '📄 Descargar PDF'}
              </button>
              <button
                onClick={() => downloadLogs('xlsx')}
                disabled={downloadingFormat === 'xlsx' || logs.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {downloadingFormat === 'xlsx' ? '⏳ Descargando...' : '📊 Descargar Excel'}
              </button>
            </div>
          </div>
          <table className="min-w-full">
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
    </div>
  );
}
