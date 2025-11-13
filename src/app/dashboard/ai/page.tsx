'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
// Gráficas simples con CSS (sin dependencias externas)

interface ModelConfig {
  n_estimators: number;
  date_range_start: string;
  date_range_end: string;
}

interface TrainingStatus {
  last_training_datetime: string;
  rmse: number;
  mae: number;
  r2: number;
}

interface Prediction {
  date: string;
  product_id: number;
  product_name: string;
  predicted_quantity: number;
}

interface PredictionResponse {
  predictions: Prediction[];
  feature_importances: {
    month: number;
    day_of_week: number;
    product_id: number;
    category_id: number;
  };
}

export default function AIPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para configuración del modelo (CU21)
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    n_estimators: 100,
    date_range_start: '',
    date_range_end: ''
  });
  
  // Estados para entrenamiento (CU22)
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  
  // Estados para predicciones (CU23, CU24)
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [featureImportances, setFeatureImportances] = useState<any>(null);
  const [predictionDateRange, setPredictionDateRange] = useState({
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchModelStatus();
    // Configurar fechas por defecto
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const lastYear = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    setModelConfig(prev => ({
      ...prev,
      date_range_start: lastYear.toISOString().split('T')[0],
      date_range_end: today.toISOString().split('T')[0]
    }));
    
    setPredictionDateRange({
      start_date: today.toISOString().split('T')[0],
      end_date: nextWeek.toISOString().split('T')[0]
    });
  }, []);

  const fetchModelStatus = async () => {
    try {
      const response = await apiClient.get('/ia/status/');
      setTrainingStatus(response.data);
    } catch (err: any) {
      // No mostrar error si no hay sesiones de entrenamiento
      if (err?.response?.status !== 404) {
        setError('Error al cargar el estado del modelo');
      }
    }
  };

  // CU21: Configurar Modelo Predictivo
  const handleConfigureModel = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await apiClient.post('/ia/configurar/', modelConfig);
      setSuccess('Configuración del modelo actualizada correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al configurar el modelo');
    } finally {
      setLoading(false);
    }
  };

  // CU22: Ejecutar Entrenamiento del Modelo
  const handleTrainModel = async () => {
    try {
      setIsTraining(true);
      setError(null);
      
      // Primero generar datos sintéticos si es necesario
      await apiClient.post('/ia/data/generate/');
      
      // Luego entrenar el modelo
      const response = await apiClient.post('/ia/train/');
      
      setSuccess(`Modelo entrenado exitosamente. RMSE: ${response.data.rmse.toFixed(2)}, R²: ${response.data.r2.toFixed(2)}`);
      setTimeout(() => setSuccess(null), 5000);
      
      // Actualizar estado
      fetchModelStatus();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al entrenar el modelo');
    } finally {
      setIsTraining(false);
    }
  };

  // CU23: Generar y Guardar Predicciones
  const handleGeneratePredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.post<PredictionResponse>('/ia/predict/', predictionDateRange);
      setPredictions(response.data.predictions);
      setFeatureImportances(response.data.feature_importances);
      
      setSuccess(`Predicciones generadas para ${response.data.predictions.length} registros`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al generar predicciones');
    } finally {
      setLoading(false);
    }
  };

  // Preparar datos para gráficas simples (CU25)
  const getProductPredictions = () => {
    if (!predictions.length) return [];

    const productData = predictions.reduce((acc, pred) => {
      if (!acc[pred.product_name]) {
        acc[pred.product_name] = 0;
      }
      acc[pred.product_name] += pred.predicted_quantity;
      return acc;
    }, {} as Record<string, number>);

    const maxValue = Math.max(...Object.values(productData));
    
    return Object.entries(productData).map(([name, value]) => ({
      name,
      value,
      percentage: (value / maxValue) * 100
    }));
  };

  const getFeatureImportances = () => {
    if (!featureImportances) return [];

    const features = [
      { name: 'Mes', value: featureImportances.month, color: '#00BCD4' },
      { name: 'Día de la Semana', value: featureImportances.day_of_week, color: '#FF9800' },
      { name: 'Producto', value: featureImportances.product_id, color: '#4CAF50' },
      { name: 'Categoría', value: featureImportances.category_id, color: '#F44336' }
    ];

    const maxValue = Math.max(...features.map(f => f.value));
    
    return features.map(feature => ({
      ...feature,
      percentage: (feature.value / maxValue) * 100
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard de IA y Predicciones (CU21-26)</h1>

      {/* Mensajes de estado */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* CU21: Configurar Modelo Predictivo */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔧 Configurar Modelo (CU21)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Estimadores
              </label>
              <input
                type="number"
                value={modelConfig.n_estimators}
                onChange={(e) => setModelConfig(prev => ({ ...prev, n_estimators: parseInt(e.target.value) || 100 }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                min="10"
                max="1000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={modelConfig.date_range_start}
                  onChange={(e) => setModelConfig(prev => ({ ...prev, date_range_start: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={modelConfig.date_range_end}
                  onChange={(e) => setModelConfig(prev => ({ ...prev, date_range_end: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                />
              </div>
            </div>
            <button
              onClick={handleConfigureModel}
              disabled={loading}
              className="w-full bg-[#00BCD4] hover:bg-[#0097A7] text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
            >
              {loading ? 'Configurando...' : 'Configurar Modelo'}
            </button>
          </div>
        </div>

        {/* CU22: Ejecutar Entrenamiento */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🚀 Entrenar Modelo (CU22)</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              El entrenamiento generará datos sintéticos y entrenará un modelo de Random Forest para predicciones de ventas.
            </p>
            <button
              onClick={handleTrainModel}
              disabled={isTraining}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md disabled:opacity-50"
            >
              {isTraining ? 'Entrenando Modelo...' : 'Iniciar Entrenamiento'}
            </button>
            
            {/* CU26: Monitorear Estado del Modelo */}
            {trainingStatus && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">📊 Estado del Modelo (CU26)</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Último Entrenamiento:</span>
                    <br />
                    {new Date(trainingStatus.last_training_datetime).toLocaleString('es-ES')}
                  </div>
                  <div>
                    <span className="font-medium">Métricas:</span>
                    <br />
                    RMSE: {trainingStatus.rmse.toFixed(2)}
                    <br />
                    MAE: {trainingStatus.mae.toFixed(2)}
                    <br />
                    R²: {trainingStatus.r2.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CU23: Generar Predicciones */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🔮 Generar Predicciones (CU23)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio Predicción
            </label>
            <input
              type="date"
              value={predictionDateRange.start_date}
              onChange={(e) => setPredictionDateRange(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin Predicción
            </label>
            <input
              type="date"
              value={predictionDateRange.end_date}
              onChange={(e) => setPredictionDateRange(prev => ({ ...prev, end_date: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
            />
          </div>
          <button
            onClick={handleGeneratePredictions}
            disabled={loading || !trainingStatus}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
          >
            {loading ? 'Generando...' : 'Generar Predicciones'}
          </button>
        </div>
        
        {!trainingStatus && (
          <p className="mt-4 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
            ⚠️ Debe entrenar el modelo antes de generar predicciones.
          </p>
        )}
      </div>

      {/* CU24, CU25: Visualizar Predicciones y Ventas Históricas */}
      {predictions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfica de Predicciones por Producto */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Predicciones por Producto (CU24)</h3>
            <div className="space-y-3">
              {getProductPredictions().slice(0, 8).map((item, index) => (
                <div key={item.name} className="flex items-center space-x-3">
                  <div className="w-24 text-sm text-gray-600 truncate" title={item.name}>
                    {item.name}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                    <div 
                      className="bg-[#00BCD4] h-4 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-sm font-medium text-gray-900">
                    {item.value.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Importancia de Características */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Importancia de Características</h3>
            <div className="space-y-4">
              {getFeatureImportances().map((feature, index) => (
                <div key={feature.name} className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: feature.color }}
                  ></div>
                  <div className="w-32 text-sm text-gray-700">
                    {feature.name}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                    <div 
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${feature.percentage}%`,
                        backgroundColor: feature.color
                      }}
                    ></div>
                  </div>
                  <div className="w-16 text-sm font-medium text-gray-900">
                    {(feature.value * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Predicciones Detalladas */}
      {predictions.length > 0 && (
        <div className="mt-8 bg-white shadow-md rounded-lg overflow-x-auto">
          <h3 className="text-lg font-semibold text-gray-800 p-4 border-b">📋 Predicciones Detalladas</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad Predicha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {predictions.slice(0, 20).map((prediction, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(prediction.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {prediction.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prediction.predicted_quantity.toFixed(0)} unidades
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {predictions.length > 20 && (
            <div className="p-4 text-center text-sm text-gray-500">
              Mostrando 20 de {predictions.length} predicciones
            </div>
          )}
        </div>
      )}
    </div>
  );
}
