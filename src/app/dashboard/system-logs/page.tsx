'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  module: string;
  user: string;
  action: string;
  details: string;
  ip_address: string;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    level: '',
    module: '',
    user: '',
    action: '',
    search: ''
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 50,
    totalItems: 0
  });

  // Datos de ejemplo para la bitácora
  const generateMockLogs = (): LogEntry[] => {
    const levels = ['INFO', 'WARNING', 'ERROR', 'DEBUG'];
    const modules = ['AUTH', 'SALES', 'INVENTORY', 'REPORTS', 'USERS', 'PRODUCTS'];
    const users = ['admin', 'test_cliente', 'operador1', 'sistema'];
    const actions = [
      'LOGIN', 'LOGOUT', 'CREATE_ORDER', 'UPDATE_PRODUCT', 'GENERATE_REPORT',
      'DELETE_USER', 'EXPORT_DATA', 'BACKUP_DATABASE', 'UPDATE_INVENTORY',
      'PROCESS_PAYMENT', 'SEND_EMAIL', 'UPLOAD_FILE'
    ];
    
    const mockLogs: LogEntry[] = [];
    
    for (let i = 1; i <= 500; i++) {
      const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const level = levels[Math.floor(Math.random() * levels.length)];
      const module = modules[Math.floor(Math.random() * modules.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      mockLogs.push({
        id: i,
        timestamp: timestamp.toISOString(),
        level,
        module,
        user,
        action,
        details: `${action} ejecutado por ${user} en módulo ${module}`,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`
      });
    }
    
    return mockLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Cargando bitácora del sistema...');
      
      // Simular carga de logs (en un caso real vendría de la API)
      const mockLogs = generateMockLogs();
      setLogs(mockLogs);
      
      console.log('✅ Bitácora cargada:', mockLogs.length, 'entradas');
      
    } catch (err: any) {
      console.error('❌ Error al cargar bitácora:', err);
      setError('Error al cargar la bitácora del sistema');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Filtro por fecha
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo + 'T23:59:59');
      filtered = filtered.filter(log => new Date(log.timestamp) <= toDate);
    }

    // Filtro por nivel
    if (filters.level) {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    // Filtro por módulo
    if (filters.module) {
      filtered = filtered.filter(log => log.module === filters.module);
    }

    // Filtro por usuario
    if (filters.user) {
      filtered = filtered.filter(log => log.user.toLowerCase().includes(filters.user.toLowerCase()));
    }

    // Filtro por acción
    if (filters.action) {
      filtered = filtered.filter(log => log.action.toLowerCase().includes(filters.action.toLowerCase()));
    }

    // Búsqueda general
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.details.toLowerCase().includes(searchTerm) ||
        log.user.toLowerCase().includes(searchTerm) ||
        log.action.toLowerCase().includes(searchTerm) ||
        log.module.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredLogs(filtered);
    setPagination(prev => ({
      ...prev,
      totalItems: filtered.length,
      currentPage: 1
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      level: '',
      module: '',
      user: '',
      action: '',
      search: ''
    });
  };

  const exportLogs = (format: 'csv' | 'json') => {
    try {
      const dataToExport = filteredLogs.slice(
        (pagination.currentPage - 1) * pagination.itemsPerPage,
        pagination.currentPage * pagination.itemsPerPage
      );

      if (format === 'csv') {
        const csvContent = [
          'ID,Timestamp,Level,Module,User,Action,Details,IP Address',
          ...dataToExport.map(log => 
            `${log.id},"${log.timestamp}","${log.level}","${log.module}","${log.user}","${log.action}","${log.details}","${log.ip_address}"`
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bitacora_sistema_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const jsonContent = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bitacora_sistema_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      setSuccess(`Bitácora exportada exitosamente en formato ${format.toUpperCase()}`);
    } catch (err) {
      setError('Error al exportar la bitácora');
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      case 'INFO': return 'bg-blue-100 text-blue-800';
      case 'DEBUG': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return '🔴';
      case 'WARNING': return '🟡';
      case 'INFO': return '🔵';
      case 'DEBUG': return '⚪';
      default: return '⚫';
    }
  };

  const paginatedLogs = filteredLogs.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando bitácora del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00BCD4] to-[#0097A7] rounded-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">📋 Bitácora del Sistema</h1>
            <p className="text-lg opacity-90">Registro completo de actividades y eventos</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <div className="text-sm opacity-75">Entradas Filtradas</div>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">🔍 Filtros Avanzados</h2>
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 border rounded"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={() => exportLogs('csv')}
              className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
            >
              📊 Exportar CSV
            </button>
            <button
              onClick={() => exportLogs('json')}
              className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            >
              📋 Exportar JSON
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({...filters, level: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
            >
              <option value="">Todos los niveles</option>
              <option value="ERROR">🔴 ERROR</option>
              <option value="WARNING">🟡 WARNING</option>
              <option value="INFO">🔵 INFO</option>
              <option value="DEBUG">⚪ DEBUG</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Módulo</label>
            <select
              value={filters.module}
              onChange={(e) => setFilters({...filters, module: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
            >
              <option value="">Todos los módulos</option>
              <option value="AUTH">🔐 AUTH</option>
              <option value="SALES">💰 SALES</option>
              <option value="INVENTORY">📦 INVENTORY</option>
              <option value="REPORTS">📊 REPORTS</option>
              <option value="USERS">👥 USERS</option>
              <option value="PRODUCTS">🛍️ PRODUCTS</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <input
              type="text"
              value={filters.user}
              onChange={(e) => setFilters({...filters, user: e.target.value})}
              placeholder="Filtrar por usuario..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Acción</label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => setFilters({...filters, action: e.target.value})}
              placeholder="Filtrar por acción..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Búsqueda General</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Buscar en todos los campos..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
            />
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🔴</div>
            <div>
              <p className="text-sm text-gray-600">Errores</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredLogs.filter(log => log.level === 'ERROR').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🟡</div>
            <div>
              <p className="text-sm text-gray-600">Advertencias</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredLogs.filter(log => log.level === 'WARNING').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🔵</div>
            <div>
              <p className="text-sm text-gray-600">Información</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredLogs.filter(log => log.level === 'INFO').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">⚪</div>
            <div>
              <p className="text-sm text-gray-600">Debug</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredLogs.filter(log => log.level === 'DEBUG').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">📋 Entradas de Bitácora</h2>
          <div className="text-sm text-gray-600">
            Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} entradas
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Módulo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.timestamp).toLocaleString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(log.level)}`}>
                      {getLevelIcon(log.level)} {log.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.module}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <label className="text-sm text-gray-700 mr-2">Mostrar:</label>
            <select
              value={pagination.itemsPerPage}
              onChange={(e) => setPagination(prev => ({...prev, itemsPerPage: parseInt(e.target.value), currentPage: 1}))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span className="text-sm text-gray-700 ml-2">entradas por página</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({...prev, currentPage: Math.max(1, prev.currentPage - 1)}))}
              disabled={pagination.currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            
            <span className="text-sm text-gray-700">
              Página {pagination.currentPage} de {totalPages}
            </span>
            
            <button
              onClick={() => setPagination(prev => ({...prev, currentPage: Math.min(totalPages, prev.currentPage + 1)}))}
              disabled={pagination.currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
