"use client";

import { useEffect, useState } from "react";
import { getLogs, exportLogs, LogEntry } from "@/services/logService";
import { downloadFile, generateFilename } from "@/utils/fileDownload";

// Extend the LogEntry interface with any additional frontend-specific properties
interface LogEntryExtended extends LogEntry {
  user: { id: number; username: string } | null;
}

export default function DashboardLogsPage() {
  const [logs, setLogs] = useState<LogEntryExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userQ, setUserQ] = useState("");
  const [actionQ, setActionQ] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'xlsx' | null>(null);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const fetchLogs = async (page: number = 1, searchParams: Record<string, string> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...searchParams,
        page,
        page_size: pageSize,
      };
      
      const { results, count } = await getLogs(params);
      setLogs(results as LogEntryExtended[]);
      setTotalLogs(count);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError(err?.message || 'Error al cargar los registros de la bitácora');
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = async (format: 'pdf' | 'xlsx') => {
    setDownloadingFormat(format);
    setError(null);
    
    try {
      const filters = {
        user: userQ.trim(),
        action: actionQ.trim(),
        start_date: startDate,
        end_date: endDate,
      };
      
      const blob = await exportLogs(format, filters);
      const filename = generateFilename('bitacora', format);
      
      // Use the file download utility
      downloadFile(blob, filename);
      
      setSuccess(`✅ Bitácora exportada correctamente (${format.toUpperCase()})`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error(`Error exporting logs (${format}):`, err);
      setError(err?.message || `Error al exportar la bitácora (${format.toUpperCase()})`);
    } finally {
      setDownloadingFormat(null);
    }
  };
  
  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const filters: Record<string, string> = {};
    if (userQ.trim()) filters.user = userQ.trim();
    if (actionQ.trim()) filters.action = actionQ.trim();
    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;
    
    // Reset to first page when applying filters
    fetchLogs(1, filters);
  };
  
  const handleResetFilters = () => {
    setUserQ('');
    setActionQ('');
    setStartDate('');
    setEndDate('');
    fetchLogs(1, {});
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, []);
  
  // Calculate pagination variables
  const totalPages = Math.ceil(totalLogs / pageSize);
  const startItem = totalLogs > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalLogs);

  if (loading && logs.length === 0) return <div className="p-6">Cargando bitácora...</div>;
  if (error && logs.length === 0) return <div className="p-6 text-red-600">{error}</div>;

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
                type="button"
                onClick={() => handleExportLogs('pdf')}
                disabled={!!downloadingFormat || logs.length === 0}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {downloadingFormat === 'pdf' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar PDF
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleExportLogs('xlsx')}
                disabled={!!downloadingFormat || logs.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {downloadingFormat === 'xlsx' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando Excel...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar Excel
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dirección IP
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        <div className="flex justify-center">
                          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="ml-2">Cargando registros...</span>
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No se encontraron registros que coincidan con los filtros
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.user?.username || <span className="text-gray-400">Sistema</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {log.ip_address}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={log.action}>
                            {log.action}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {(totalPages > 1 || loading) && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => fetchLogs(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => fetchLogs(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{startItem}</span> a <span className="font-medium">{endItem}</span> de{' '}
                      <span className="font-medium">{totalLogs}</span> registros
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => fetchLogs(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Anterior</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Calculate page number to display (centered around current page)
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => fetchLogs(pageNum)}
                            disabled={loading}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => fetchLogs(currentPage + 1)}
                        disabled={currentPage >= totalPages || loading}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Siguiente</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
