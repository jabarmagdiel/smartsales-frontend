'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';

interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  category: 'SALES' | 'INVENTORY' | 'CUSTOMERS' | 'FINANCIAL';
  parameters: any;
}

interface GeneratedReport {
  id: number;
  title: string;
  data: any;
  created_at: string;
  status: string;
}

export default function IntelligentReportsPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para generador personalizado
  const [customQuery, setCustomQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Cargando plantillas y reportes...');
      
      // Cargar plantillas predefinidas
      const templatesResponse = await apiClient.get('/templates/');
      console.log('✅ Plantillas cargadas:', templatesResponse.data);
      setTemplates(templatesResponse.data.results || templatesResponse.data);
      
      // Cargar reportes generados
      const reportsResponse = await apiClient.get('/reports/');
      console.log('✅ Reportes cargados:', reportsResponse.data);
      setReports(reportsResponse.data.results || reportsResponse.data);
      
    } catch (err: any) {
      console.error('❌ Error al cargar datos:', err);
      setError(err?.response?.data?.detail || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const generatePredefinedReport = async (templateId: number) => {
    setGenerating(true);
    setError(null);
    
    try {
      console.log('🔍 Generando reporte predefinido:', templateId);
      
      const response = await apiClient.post('/reports/generate_predefined/', {
        template_id: templateId,
        parameters: {}
      });
      
      console.log('✅ Reporte generado:', response.data);
      setSuccess('✅ Reporte generado exitosamente');
      setSelectedReport(response.data);
      
      // Recargar lista de reportes
      loadData();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('❌ Error al generar reporte:', err);
      setError(err?.response?.data?.error || 'Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  const generateCustomReport = async () => {
    if (!customQuery.trim()) {
      setError('Por favor escribe una consulta');
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    try {
      console.log('🔍 Generando reporte personalizado:', customQuery);
      
      const response = await apiClient.post('/reports/generate_custom/', {
        query_text: customQuery
      });
      
      console.log('✅ Reporte personalizado generado:', response.data);
      setSuccess('✅ Reporte personalizado generado exitosamente');
      setSelectedReport(response.data);
      setCustomQuery('');
      
      // Recargar lista de reportes
      loadData();
      
      setTimeout(() => setSuccess(null), 3000);
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

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
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
      setError('Error en el reconocimiento de voz');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SALES': return 'bg-green-100 text-green-800 border-green-200';
      case 'INVENTORY': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CUSTOMERS': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'FINANCIAL': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
            {/* Ventas */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                💰 VENTAS
              </h3>
              <div className="space-y-3">
                {templates.filter(t => t.category === 'SALES').map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500">{template.description}</p>
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
            </div>

            {/* Inventario */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                📦 INVENTARIO
              </h3>
              <div className="space-y-3">
                {templates.filter(t => t.category === 'INVENTORY').map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500">{template.description}</p>
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
            </div>

            {/* Clientes */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                👥 CLIENTES
              </h3>
              <div className="space-y-3">
                {templates.filter(t => t.category === 'CUSTOMERS').map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500">{template.description}</p>
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
            </div>
          </div>
        </div>

        {/* Generador de Reportes */}
        <div className="bg-white shadow-md rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              🤖 Generador de Reportes
            </h2>
            <p className="text-sm text-gray-600">Consulta personalizada:</p>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escribe tu consulta en lenguaje natural:
              </label>
              <textarea
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
                placeholder="Ej: productos más vendidos, inventario actual, clientes registrados este año..."
              />
            </div>

            <div className="flex gap-3 mb-6">
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">📋 Resultado del Reporte</h2>
            <p className="text-sm text-gray-600">{selectedReport.title}</p>
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
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-[#00BCD4] hover:text-[#0097A7]"
                      >
                        Ver
                      </button>
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
