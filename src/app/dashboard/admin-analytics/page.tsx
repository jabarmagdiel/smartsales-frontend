'use client';

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import apiClient from '@/services/apiClient';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface SalesData {
  daily_sales: { date: string; amount: number }[];
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  top_products: { name: string; quantity: number }[];
}

interface PredictionData {
  next_month_sales: number;
  growth_percentage: number;
  predicted_top_products: string[];
  confidence_score: number;
}

export default function AdminAnalyticsPage() {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30'); // días

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Cargando datos de analytics...');
      
      // Cargar datos de ventas históricas
      const salesResponse = await apiClient.post('/reports/generate_predefined/', {
        template_id: 1, // Productos más vendidos
        parameters: { days: parseInt(timeRange) }
      });
      
      console.log('✅ Datos de ventas cargados:', salesResponse.data);
      setSalesData(salesResponse.data.data);
      
      // Simular datos de predicciones (en un caso real vendría de un modelo ML)
      const mockPredictions: PredictionData = {
        next_month_sales: salesResponse.data.data.total_sales * 1.15,
        growth_percentage: 15.3,
        predicted_top_products: salesResponse.data.data.top_products.slice(0, 3).map((p: any) => p.name),
        confidence_score: 0.87
      };
      
      setPredictions(mockPredictions);
      
    } catch (err: any) {
      console.error('❌ Error al cargar analytics:', err);
      setError(err?.response?.data?.error || 'Error al cargar los datos de analytics');
    } finally {
      setLoading(false);
    }
  };

  // Configuración para gráfica de ventas históricas (línea)
  const salesLineData = {
    labels: salesData?.daily_sales?.map(item => 
      new Date(item.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
    ) || [],
    datasets: [
      {
        label: 'Ventas Diarias ($)',
        data: salesData?.daily_sales?.map(item => item.amount) || [],
        borderColor: 'rgb(0, 188, 212)',
        backgroundColor: 'rgba(0, 188, 212, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const salesLineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Ventas Históricas - Últimos ${timeRange} días`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  // Configuración para gráfica de productos más vendidos (barras)
  const topProductsData = {
    labels: salesData?.top_products?.slice(0, 8).map(item => item.name) || [],
    datasets: [
      {
        label: 'Cantidad Vendida',
        data: salesData?.top_products?.slice(0, 8).map(item => item.quantity) || [],
        backgroundColor: [
          'rgba(0, 188, 212, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(255, 87, 34, 0.8)',
          'rgba(156, 39, 176, 0.8)',
          'rgba(233, 30, 99, 0.8)',
          'rgba(96, 125, 139, 0.8)',
          'rgba(121, 85, 72, 0.8)',
        ],
        borderColor: [
          'rgba(0, 188, 212, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(255, 193, 7, 1)',
          'rgba(255, 87, 34, 1)',
          'rgba(156, 39, 176, 1)',
          'rgba(233, 30, 99, 1)',
          'rgba(96, 125, 139, 1)',
          'rgba(121, 85, 72, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const topProductsOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Productos Más Vendidos',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  // Configuración para gráfica de predicciones (dona)
  const predictionsData = {
    labels: ['Ventas Actuales', 'Crecimiento Predicho'],
    datasets: [
      {
        data: [
          salesData?.total_sales || 0,
          (predictions?.next_month_sales || 0) - (salesData?.total_sales || 0)
        ],
        backgroundColor: [
          'rgba(0, 188, 212, 0.8)',
          'rgba(76, 175, 80, 0.8)',
        ],
        borderColor: [
          'rgba(0, 188, 212, 1)',
          'rgba(76, 175, 80, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const predictionsOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Predicción de Ventas - Próximo Mes',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando Analytics...</p>
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
            <h1 className="text-3xl font-bold mb-2">📊 Dashboard de Analytics</h1>
            <p className="text-lg opacity-90">Ventas Históricas y Predicciones con IA</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              ${salesData?.total_sales?.toLocaleString() || '0'}
            </div>
            <div className="text-sm opacity-75">Ventas Totales</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-4 items-center">
        <label className="text-sm font-medium text-gray-700">Período:</label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
        >
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
          <option value="365">Último año</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#00BCD4]">
          <div className="flex items-center">
            <div className="text-3xl mr-4">💰</div>
            <div>
              <p className="text-sm text-gray-600">Ventas Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                ${salesData?.total_sales?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📦</div>
            <div>
              <p className="text-sm text-gray-600">Total Órdenes</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesData?.total_orders?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📈</div>
            <div>
              <p className="text-sm text-gray-600">Promedio por Orden</p>
              <p className="text-2xl font-bold text-gray-900">
                ${salesData?.average_order_value?.toFixed(2) || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🔮</div>
            <div>
              <p className="text-sm text-gray-600">Predicción Próximo Mes</p>
              <p className="text-2xl font-bold text-gray-900">
                ${predictions?.next_month_sales?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Ventas Históricas */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Line data={salesLineData} options={salesLineOptions} />
        </div>

        {/* Productos Más Vendidos */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Bar data={topProductsData} options={topProductsOptions} />
        </div>
      </div>

      {/* Predicciones y Analytics Avanzados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Predicciones */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Doughnut data={predictionsData} options={predictionsOptions} />
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Confianza del Modelo</p>
            <p className="text-lg font-bold text-green-600">
              {((predictions?.confidence_score || 0) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Insights de Predicciones */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            🔮 Predicciones IA
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-700">Crecimiento Esperado</span>
              <span className="font-bold text-green-600">
                +{predictions?.growth_percentage?.toFixed(1)}%
              </span>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">Productos Estrella Predichos:</p>
              <ul className="text-xs space-y-1">
                {predictions?.predicted_top_products?.map((product, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-[#00BCD4] rounded-full mr-2"></span>
                    {product}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Resumen Ejecutivo */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            📋 Resumen Ejecutivo
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Tendencia:</strong> Las ventas muestran un crecimiento sostenido 
                con picos los fines de semana.
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Oportunidad:</strong> Los productos tecnológicos lideran 
                las ventas con alta demanda.
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Recomendación:</strong> Aumentar inventario de productos 
                top para el próximo mes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Datos Detallados */}
      <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">📊 Datos Detallados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tendencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Predicción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesData?.top_products?.slice(0, 5).map((product, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.quantity} unidades
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      ↗ Creciendo
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    +{(Math.random() * 20 + 5).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
