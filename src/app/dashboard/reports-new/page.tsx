'use client';

import React, { useState, useEffect, useRef } from 'react';
import apiClient from '@/services/apiClient';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
  category: 'ventas' | 'inventario' | 'clientes' | 'general';
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'top-products',
    name: 'Productos Más Vendidos',
    description: 'Top 10 productos con mayor cantidad vendida',
    icon: '🏆',
    prompt: 'productos más vendidos',
    category: 'ventas'
  },
  {
    id: 'current-inventory',
    name: 'Inventario Actual',
    description: 'Stock completo con precios actuales',
    icon: '📦',
    prompt: 'inventario actual',
    category: 'inventario'
  },
  {
    id: 'customers-this-year',
    name: 'Clientes Registrados',
    description: 'Clientes registrados en el año actual',
    icon: '👥',
    prompt: 'clientes registrados este año',
    category: 'clientes'
  },
  {
    id: 'monthly-sales',
    name: 'Ventas del Mes',
    description: 'Reporte de ventas del mes actual',
    icon: '📈',
    prompt: 'ventas del mes actual',
    category: 'ventas'
  },
  {
    id: 'low-stock',
    name: 'Stock Bajo',
    description: 'Productos con stock menor a 10 unidades',
    icon: '⚠️',
    prompt: 'productos con stock bajo',
    category: 'inventario'
  },
  {
    id: 'sales-by-status',
    name: 'Ventas por Estado',
    description: 'Órdenes agrupadas por estado',
    icon: '📊',
    prompt: 'órdenes por estado',
    category: 'ventas'
  }
];

export default function ReportsNewPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [currentQueryId, setCurrentQueryId] = useState<number | null>(null);
  
  // Voice recognition
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for voice recognition support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCustomPrompt(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        setError('Error en el reconocimiento de voz');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      setError(null);
    }
  };

  const generateReport = async (prompt: string) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setCurrentQueryId(null);

    try {
      const response = await apiClient.post('/reportes/query/', { prompt });
      setResults(response.data.results);
      setCurrentQueryId(response.data.query_id);
      setSuccess('✅ Reporte generado exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format: 'pdf' | 'xlsx') => {
    if (!currentQueryId) {
      setError('Primero debes generar un reporte');
      return;
    }

    setDownloadingFormat(format);
    setError(null);

    try {
      const response = await apiClient.get('/reportes/generate/', {
        params: {
          query_id: currentQueryId,
          formato: format
        },
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${currentQueryId}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(`📄 Archivo ${format.toUpperCase()} descargado exitosamente`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || `Error al descargar ${format.toUpperCase()}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setCustomPrompt(template.prompt);
    setError(null);
  };

  const handleCustomSubmit = () => {
    if (!customPrompt.trim()) {
      setError('Por favor ingresa una consulta');
      return;
    }
    generateReport(customPrompt);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ventas': return 'bg-green-100 text-green-800 border-green-200';
      case 'inventario': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'clientes': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const groupedTemplates = REPORT_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ReportTemplate[]>);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00BCD4] to-[#0097A7] text-white p-6 rounded-lg mb-8">
          <h1 className="text-3xl font-bold mb-2">📊 Centro de Reportes Inteligente</h1>
          <p className="text-lg opacity-90">Genera reportes dinámicos con IA y reconocimiento de voz</p>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Templates */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🎯 Reportes Predefinidos</h2>
              
              {Object.entries(groupedTemplates).map(([category, templates]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
                    {category === 'ventas' ? '💰 Ventas' : 
                     category === 'inventario' ? '📦 Inventario' : 
                     category === 'clientes' ? '👥 Clientes' : '📊 General'}
                  </h3>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                          selectedTemplate?.id === template.id 
                            ? 'border-[#00BCD4] bg-[#00BCD4]/10' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900">{template.name}</div>
                            <div className="text-sm text-gray-600 mt-1">{template.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Generator and Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generator */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🎤 Generador de Reportes</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consulta personalizada:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Ej: productos más vendidos, inventario actual, clientes del año..."
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
                      onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                    />
                    {voiceSupported && (
                      <button
                        onClick={toggleVoiceRecognition}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          isListening 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                        }`}
                      >
                        {isListening ? '🔴 Detener' : '🎤 Voz'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCustomSubmit}
                    disabled={loading || !customPrompt.trim()}
                    className="bg-[#00BCD4] hover:bg-[#0097A7] text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 transition-colors"
                  >
                    {loading ? '⏳ Generando...' : '🔍 Generar Reporte'}
                  </button>
                </div>

                {/* Download buttons */}
                {results && currentQueryId && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => downloadReport('pdf')}
                      disabled={downloadingFormat === 'pdf'}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {downloadingFormat === 'pdf' ? '⏳ Descargando...' : '📄 Descargar PDF'}
                    </button>
                    <button
                      onClick={() => downloadReport('xlsx')}
                      disabled={downloadingFormat === 'xlsx'}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {downloadingFormat === 'xlsx' ? '⏳ Descargando...' : '📊 Descargar Excel'}
                    </button>
                  </div>
                )}
              </div>

              {/* Examples */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Ejemplos de comandos:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-700">
                  <div>• "Productos más vendidos"</div>
                  <div>• "Inventario actual"</div>
                  <div>• "Clientes registrados este año"</div>
                  <div>• "Ventas del mes de octubre"</div>
                  <div>• "Órdenes por estado"</div>
                  <div>• "Stock bajo"</div>
                </div>
              </div>
            </div>

            {/* Results */}
            {results && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-800">📋 Resultados del Reporte</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {Array.isArray(results) ? `${results.length} registros encontrados` : 'Datos del reporte'}
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  {Array.isArray(results) && results.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(results[0]).map((key) => (
                            <th
                              key={key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No se encontraron datos para mostrar
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
