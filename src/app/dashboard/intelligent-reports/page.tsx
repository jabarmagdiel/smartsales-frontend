'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';

interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  parameters: any;
}

interface GeneratedReport {
  id: number;
  title: string;
  data: any;
  status: string;
  created_at: string;
}

// Declarar tipos para Speech Recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function IntelligentReportsPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    status: ''
  });

  useEffect(() => {
    loadTemplates();
    loadReports();
  }, []);

  const loadTemplates = async () => {
    try {
      console.log('🔍 Cargando plantillas de reportes...');
      const response = await apiClient.get('/templates/');
      console.log('✅ Plantillas cargadas:', response.data);
      setTemplates(response.data.results || response.data || []);
    } catch (err: any) {
      console.error('❌ Error al cargar plantillas:', err);
      setError('Error al cargar las plantillas de reportes');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      console.log('🔍 Cargando reportes generados...');
      const response = await apiClient.get('/reports/');
      console.log('✅ Reportes cargados:', response.data);
      setReports(response.data.results || response.data || []);
    } catch (err: any) {
      console.error('❌ Error al cargar reportes:', err);
    }
  };

  const generatePredefinedReport = async (templateId: number) => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      
      console.log('📊 Generando reporte predefinido:', templateId);
      
      const response = await apiClient.post('/reports/generate_predefined/', {
        template_id: templateId,
        parameters: filters
      });
      
      console.log('✅ Reporte generado:', response.data);
      setSuccess('Reporte generado exitosamente');
      
      // Recargar reportes
      await loadReports();
      
      // Seleccionar el reporte recién generado
      if (response.data.report) {
        setSelectedReport(response.data.report);
      }
      
    } catch (err: any) {
      console.error('❌ Error al generar reporte:', err);
      setError(err?.response?.data?.error || 'Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  const generateCustomReport = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      
      console.log('🤖 Generando reporte personalizado:', customQuery);
      
      const response = await apiClient.post('/reports/generate_custom/', {
        query_text: customQuery,
        parameters: filters
      });
      
      console.log('✅ Reporte personalizado generado:', response.data);
      setSuccess('Reporte personalizado generado exitosamente');
      setCustomQuery('');
      
      // Recargar reportes
      await loadReports();
      
      // Seleccionar el reporte recién generado
      if (response.data.report) {
        setSelectedReport(response.data.report);
      }
      
    } catch (err: any) {
      console.error('❌ Error al generar reporte personalizado:', err);
      setError(err?.response?.data?.error || 'Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log('🎤 Iniciando reconocimiento de voz...');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      console.log('🗣️ Transcripción:', transcript);
      setCustomQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Error en reconocimiento de voz:', event.error);
      setError(`Error en reconocimiento de voz: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('🎤 Reconocimiento de voz finalizado');
    };

    recognition.start();
  };

  // Funciones de descarga
  const downloadPDF = async (report: GeneratedReport) => {
    try {
      setError(null);
      console.log('📄 Descargando PDF para reporte:', report.id);
      
      const response = await apiClient.post('/reports/export_pdf/', {
        report_id: report.id,
        format: 'pdf'
      }, {
        responseType: 'blob'
      });
      
      // Crear blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${report.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('PDF descargado exitosamente');
    } catch (err: any) {
      console.error('❌ Error al descargar PDF:', err);
      
      // Fallback: generar PDF simple con los datos
      try {
        const htmlContent = `
          <html>
            <head>
              <title>Reporte ${report.title}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background: #00BCD4; color: white; padding: 20px; margin-bottom: 20px; }
                .data { background: #f5f5f5; padding: 15px; border-radius: 5px; }
                pre { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${report.title}</h1>
                <p>Fecha: ${new Date(report.created_at).toLocaleDateString('es-ES')}</p>
              </div>
              <div class="data">
                <pre>${JSON.stringify(report.data, null, 2)}</pre>
              </div>
            </body>
          </html>
        `;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_${report.id}_${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSuccess('Reporte descargado como HTML (PDF no disponible)');
      } catch (fallbackErr) {
        setError('Error al descargar el reporte');
      }
    }
  };

  const downloadExcel = async (report: GeneratedReport) => {
    try {
      setError(null);
      console.log('📊 Descargando Excel para reporte:', report.id);
      
      const response = await apiClient.post('/reports/export_excel/', {
        report_id: report.id,
        format: 'excel'
      }, {
        responseType: 'blob'
      });
      
      // Crear blob y descargar
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${report.id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Excel descargado exitosamente');
    } catch (err: any) {
      console.error('❌ Error al descargar Excel:', err);
      
      // Fallback: generar CSV
      try {
        let csvContent = '';
        
        if (Array.isArray(report.data)) {
          // Si es un array, convertir a CSV
          const headers = Object.keys(report.data[0] || {});
          csvContent = headers.join(',') + '\n';
          report.data.forEach((row: any) => {
            csvContent += headers.map(header => row[header] || '').join(',') + '\n';
          });
        } else {
          // Si es un objeto, convertir a CSV simple
          csvContent = 'Campo,Valor\n';
          Object.entries(report.data).forEach(([key, value]) => {
            csvContent += `${key},"${value}"\n`;
          });
        }
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_${report.id}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSuccess('Reporte descargado como CSV (Excel no disponible)');
      } catch (fallbackErr) {
        setError('Error al descargar el reporte');
      }
    }
  };

  const downloadJSON = (report: GeneratedReport) => {
    try {
      const dataStr = JSON.stringify(report.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${report.id}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('JSON descargado exitosamente');
    } catch (err: any) {
      console.error('❌ Error al descargar JSON:', err);
      setError('Error al descargar JSON');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SALES': return '💰';
      case 'INVENTORY': return '📦';
      case 'CUSTOMERS': return '👥';
      case 'FINANCIAL': return '📊';
      default: return '📋';
    }
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      category: '',
      status: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando Centro de Reportes...</p>
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
            <h1 className="text-3xl font-bold mb-2">📊 Centro de Reportes Inteligente</h1>
            <p className="text-lg opacity-90">Genera reportes dinámicos con IA y reconocimiento de voz</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{reports.length}</div>
            <div className="text-sm opacity-75">Reportes Generados</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">🔍 Filtros</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Limpiar Filtros
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
            >
              <option value="">Todas las categorías</option>
              <option value="SALES">💰 Ventas</option>
              <option value="INVENTORY">📦 Inventario</option>
              <option value="CUSTOMERS">👥 Clientes</option>
              <option value="FINANCIAL">📊 Financiero</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
            >
              <option value="">Todos los estados</option>
              <option value="COMPLETED">✅ Completado</option>
              <option value="PENDING">⏳ Pendiente</option>
              <option value="FAILED">❌ Fallido</option>
            </select>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reportes Predefinidos */}
        <div className="bg-white shadow-md rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              🎯 Reportes Predefinidos
            </h2>
          </div>
          
          <div className="p-6">
            {templates.length === 0 ? (
              <p className="text-gray-500 text-center">No hay plantillas disponibles</p>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getCategoryIcon(template.category)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => generatePredefinedReport(template.id)}
                        disabled={generating}
                        className="bg-[#00BCD4] hover:bg-[#0097A7] text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                      >
                        {generating ? '⏳' : '📊'} Generar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generador Personalizado */}
        <div className="bg-white shadow-md rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              🤖 Generador Personalizado
            </h2>
          </div>
          
          <div className="p-6">
            <textarea
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Escribe tu consulta o usa reconocimiento de voz..."
              className="w-full h-32 border border-gray-300 rounded-md px-3 py-2 resize-none focus:ring-[#00BCD4] focus:border-[#00BCD4]"
            />

            <div className="flex gap-3 mb-6 mt-4">
              <button
                onClick={generateCustomReport}
                disabled={generating || !customQuery.trim()}
                className="flex-1 bg-[#00BCD4] hover:bg-[#0097A7] text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
              >
                {generating ? '⏳ Generando...' : '📤 Generar Reporte'}
              </button>
              <button
                onClick={startVoiceRecognition}
                disabled={generating || isListening}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {isListening ? '🔴 Escuchando...' : '🎤 Voz'}
              </button>
            </div>

            {/* Ejemplos de comandos */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">💡 Ejemplos de comandos:</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <button 
                  onClick={() => setCustomQuery("productos más vendidos")}
                  className="text-left text-[#00BCD4] hover:underline"
                >
                  • "Productos más vendidos"
                </button>
                <button 
                  onClick={() => setCustomQuery("inventario actual")}
                  className="text-left text-[#00BCD4] hover:underline"
                >
                  • "Inventario actual"
                </button>
                <button 
                  onClick={() => setCustomQuery("ventas del mes de octubre")}
                  className="text-left text-[#00BCD4] hover:underline"
                >
                  • "Ventas del mes de octubre"
                </button>
                <button 
                  onClick={() => setCustomQuery("stock bajo")}
                  className="text-left text-[#00BCD4] hover:underline"
                >
                  • "Stock bajo"
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reporte Seleccionado */}
      {selectedReport && (
        <div className="mt-8 bg-white shadow-md rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">📋 Resultado del Reporte</h2>
              <p className="text-sm text-gray-600">{selectedReport.title}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => downloadPDF(selectedReport)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                📄 Descargar PDF
              </button>
              <button
                onClick={() => downloadExcel(selectedReport)}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                📊 Descargar Excel
              </button>
              <button
                onClick={() => downloadJSON(selectedReport)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                📋 Descargar JSON
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <pre className="bg-gray-50 rounded-lg p-4 overflow-auto text-sm">
              {JSON.stringify(selectedReport.data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Historial de Reportes */}
      <div className="mt-8 bg-white shadow-md rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">📚 Historial de Reportes</h2>
        </div>
        
        {reports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No hay reportes generados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="text-[#00BCD4] hover:text-[#0097A7]"
                        >
                          👁️ Ver
                        </button>
                        <button
                          onClick={() => downloadPDF(report)}
                          className="text-red-600 hover:text-red-800"
                        >
                          📄 PDF
                        </button>
                        <button
                          onClick={() => downloadExcel(report)}
                          className="text-green-600 hover:text-green-800"
                        >
                          📊 Excel
                        </button>
                        <button
                          onClick={() => downloadJSON(report)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          📋 JSON
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
