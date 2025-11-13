// src/app/dashboard/reports/page.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generateReportQuery, downloadReportFile } from '@/services/reportService';

// Función helper para forzar la descarga del archivo
const triggerFileDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  const [prompt, setPrompt] = useState<string>('Ventas de Septiembre en PDF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null); // Para mostrar en pantalla
  
  // Estados para reconocimiento de voz (CU16)
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  
  // Verificar soporte de reconocimiento de voz
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setVoiceSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';
        
        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const speechResult = event.results[0][0].transcript;
          setTranscript(speechResult);
          setPrompt(speechResult);
        };
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          setError(`Error de reconocimiento de voz: ${event.error}`);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Función para iniciar/detener reconocimiento de voz
  const toggleVoiceRecognition = () => {
    if (!voiceSupported) {
      setError('El reconocimiento de voz no está soportado en este navegador');
      return;
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
    }
  };
  
  const handleSubmit = async (format: 'pdf' | 'xlsx' | 'json') => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // 1. Enviar el prompt al backend para que lo interprete (CU15/CU17)
      const queryResponse = await generateReportQuery(prompt);

      if (format === 'json') {
        // 2. Si es 'json', solo muestra los resultados en pantalla (CU19)
        setResults(queryResponse.results);
      } else {
        // 3. Si es PDF o Excel, llama al endpoint de descarga (CU18/CU20)
        const blob = await downloadReportFile(queryResponse.query_id, format);
        
        // 4. Activa la descarga en el navegador
        triggerFileDownload(blob, `reporte_${queryResponse.query_id}.${format}`);
      }
      
    } catch (err: any) {
      setError(err.message || 'Error al generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reportes Dinámicos (CU15/CU16)</h1>

      {/* --- Input de Prompts (CU15/CU16) --- */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Generador de Reportes (Texto y Voz)</h2>
        
        {error && (
          <p className="mb-4 text-red-600 bg-red-100 p-3 rounded-md border border-red-300">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="prompt" className="text-sm font-medium text-gray-700">
              Escribe tu consulta o usa reconocimiento de voz:
            </label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                placeholder="Ej: Ventas de Septiembre agrupado por producto en PDF"
              />
              <button
                onClick={toggleVoiceRecognition}
                disabled={!voiceSupported}
                className={`px-4 py-3 rounded-md font-medium transition-colors ${
                  isListening 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-[#FF9800] hover:bg-[#FB8C00] text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={voiceSupported ? (isListening ? 'Detener grabación' : 'Iniciar reconocimiento de voz') : 'Reconocimiento de voz no soportado'}
              >
                {isListening ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a2 2 0 114 0v4a2 2 0 11-4 0V7z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Indicador de estado de voz */}
            {isListening && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-700 font-medium">Escuchando... Habla ahora</span>
                </div>
              </div>
            )}
            
            {/* Mostrar transcripción */}
            {transcript && !isListening && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <span className="text-sm text-green-700">
                  <strong>Transcripción:</strong> {transcript}
                </span>
              </div>
            )}
            
            {/* Mensaje de no soporte */}
            {!voiceSupported && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <span className="text-sm text-yellow-700">
                  ⚠️ El reconocimiento de voz no está disponible en este navegador. Usa Chrome, Edge o Safari para esta funcionalidad.
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Botón de Visualizar (CU19) */}
            <button
              onClick={() => handleSubmit('json')}
              disabled={loading || !prompt.trim()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50"
            >
              {loading ? 'Generando...' : 'Visualizar en Pantalla'}
            </button>
            
            {/* Botón de PDF (CU18) */}
            <button
              onClick={() => handleSubmit('pdf')}
              disabled={loading || !prompt.trim()}
              className="bg-[#00BCD4] hover:bg-[#0097A7] text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50"
            >
              {loading ? 'Generando...' : 'Descargar PDF'}
            </button>

            {/* Botón de Excel (CU18) */}
            <button
              onClick={() => handleSubmit('xlsx')}
              disabled={loading || !prompt.trim()}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50"
            >
              {loading ? 'Generando...' : 'Descargar Excel'}
            </button>
          </div>
          
          {/* Ejemplos de comandos de voz */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Ejemplos de comandos de voz:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• "Ventas del mes de octubre en PDF"</li>
              <li>• "Reporte de productos más vendidos en Excel"</li>
              <li>• "Mostrar inventario actual en pantalla"</li>
              <li>• "Clientes registrados este año"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* --- Área de Visualización (CU19) --- */}
      {results && (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <h2 className="text-xl font-semibold text-gray-700 p-4 border-b">Resultados en Pantalla</h2>
          {/* Mostramos los datos como una tabla simple si es un array */}
          {Array.isArray(results) && results.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(results[0]).map(key => (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((val: any, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <pre className="p-4 bg-gray-50 text-sm text-gray-800">
              {JSON.stringify(results, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}