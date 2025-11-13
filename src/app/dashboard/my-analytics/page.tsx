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
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
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

interface Order {
  id: number;
  created_at: string;
  total: number;
  status: string;
  items: any[];
}

interface PurchaseStats {
  total_spent: number;
  total_orders: number;
  average_order: number;
  favorite_categories: { [key: string]: number };
  monthly_spending: { [key: string]: number };
}

export default function MyAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<PurchaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('12'); // meses

  useEffect(() => {
    loadMyAnalytics();
  }, [timeRange]);

  const loadMyAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Cargando mis analytics...');
      
      // Cargar mis órdenes
      const ordersResponse = await apiClient.get('/pedidos/');
      console.log('✅ Órdenes cargadas:', ordersResponse.data);
      
      const myOrders = ordersResponse.data.results || ordersResponse.data;
      setOrders(myOrders);
      
      // Calcular estadísticas
      const calculatedStats = calculateStats(myOrders);
      setStats(calculatedStats);
      
    } catch (err: any) {
      console.error('❌ Error al cargar mis analytics:', err);
      setError(err?.response?.data?.detail || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orders: Order[]): PurchaseStats => {
    const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
    const totalOrders = orders.length;
    const averageOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    // Calcular gastos mensuales
    const monthlySpending: { [key: string]: number } = {};
    const favoriteCategories: { [key: string]: number } = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
      
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + parseFloat(order.total.toString());
      
      // Simular categorías (en un caso real vendría de los items)
      const categories = ['Electrónicos', 'Ropa', 'Hogar', 'Deportes', 'Libros'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      favoriteCategories[randomCategory] = (favoriteCategories[randomCategory] || 0) + 1;
    });
    
    return {
      total_spent: totalSpent,
      total_orders: totalOrders,
      average_order: averageOrder,
      favorite_categories: favoriteCategories,
      monthly_spending: monthlySpending
    };
  };

  // Configuración para gráfica de gastos mensuales
  const monthlySpendingData = {
    labels: Object.keys(stats?.monthly_spending || {}),
    datasets: [
      {
        label: 'Gastos Mensuales ($)',
        data: Object.values(stats?.monthly_spending || {}),
        borderColor: 'rgb(0, 188, 212)',
        backgroundColor: 'rgba(0, 188, 212, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const monthlySpendingOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Mi Historial de Gastos Mensuales',
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

  // Configuración para gráfica de categorías favoritas
  const categoriesData = {
    labels: Object.keys(stats?.favorite_categories || {}),
    datasets: [
      {
        data: Object.values(stats?.favorite_categories || {}),
        backgroundColor: [
          'rgba(0, 188, 212, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(255, 87, 34, 0.8)',
          'rgba(156, 39, 176, 0.8)',
        ],
        borderColor: [
          'rgba(0, 188, 212, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(255, 193, 7, 1)',
          'rgba(255, 87, 34, 1)',
          'rgba(156, 39, 176, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const categoriesOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Mis Categorías Favoritas',
      },
    },
  };

  // Configuración para gráfica de estados de órdenes
  const orderStatusData = {
    labels: ['Entregadas', 'Pagadas', 'Pendientes', 'Canceladas'],
    datasets: [
      {
        data: [
          orders.filter(o => o.status === 'DELIVERED').length,
          orders.filter(o => o.status === 'PAID').length,
          orders.filter(o => o.status === 'PENDING').length,
          orders.filter(o => o.status === 'CANCELLED').length,
        ],
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(0, 188, 212, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(244, 67, 54, 0.8)',
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(0, 188, 212, 1)',
          'rgba(255, 193, 7, 1)',
          'rgba(244, 67, 54, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const orderStatusOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Estado de Mis Órdenes',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando mis estadísticas...</p>
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
            <h1 className="text-3xl font-bold mb-2">📊 Mis Estadísticas de Compras</h1>
            <p className="text-lg opacity-90">Análisis personal de tus hábitos de compra</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              ${stats?.total_spent?.toLocaleString() || '0'}
            </div>
            <div className="text-sm opacity-75">Total Gastado</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Métricas Personales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#00BCD4]">
          <div className="flex items-center">
            <div className="text-3xl mr-4">💰</div>
            <div>
              <p className="text-sm text-gray-600">Total Gastado</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats?.total_spent?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🛍️</div>
            <div>
              <p className="text-sm text-gray-600">Mis Órdenes</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total_orders || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📈</div>
            <div>
              <p className="text-sm text-gray-600">Promedio por Compra</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats?.average_order?.toFixed(2) || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="text-3xl mr-4">⭐</div>
            <div>
              <p className="text-sm text-gray-600">Categoría Favorita</p>
              <p className="text-lg font-bold text-gray-900">
                {Object.keys(stats?.favorite_categories || {}).length > 0 
                  ? Object.keys(stats?.favorite_categories || {}).reduce((a, b) => 
                      (stats?.favorite_categories?.[a] || 0) > (stats?.favorite_categories?.[b] || 0) ? a : b
                    )
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Gastos Mensuales */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Line data={monthlySpendingData} options={monthlySpendingOptions} />
        </div>

        {/* Categorías Favoritas */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Doughnut data={categoriesData} options={categoriesOptions} />
        </div>
      </div>

      {/* Segunda Fila de Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Estado de Órdenes */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Pie data={orderStatusData} options={orderStatusOptions} />
        </div>

        {/* Insights Personales */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            💡 Insights Personales
          </h3>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Patrón de Compra:</strong> Compras más frecuentes los fines de semana
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Ahorro Potencial:</strong> Puedes ahorrar 15% comprando en ofertas
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Recomendación:</strong> Considera productos de tu categoría favorita
              </p>
            </div>
          </div>
        </div>

        {/* Metas y Logros */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            🏆 Mis Logros
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-gray-700">🥇 Cliente Frecuente</span>
              <span className="text-xs bg-yellow-200 px-2 py-1 rounded">Desbloqueado</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-700">💎 Comprador Premium</span>
              <span className="text-xs bg-blue-200 px-2 py-1 rounded">
                {(stats?.total_spent || 0) > 1000 ? 'Desbloqueado' : 'En Progreso'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-700">🎯 Meta Mensual</span>
              <span className="text-xs bg-green-200 px-2 py-1 rounded">75%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historial Detallado */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">📋 Mi Historial de Compras</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.slice(0, 10).map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id.toString().padStart(6, '0')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    ${parseFloat(order.total.toString()).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      order.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.items?.length || 0} productos
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
