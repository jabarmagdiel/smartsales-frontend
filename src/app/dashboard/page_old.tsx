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
import { useAuth } from '@/context/AuthContext';
import { getAccessToken } from '@/services/authService';
import apiClient from '@/services/apiClient';
import Link from 'next/link';

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

interface AdminStats {
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  top_products: { name: string; quantity: number }[];
  daily_sales: { date: string; amount: number }[];
  total_customers: number;
  total_products: number;
  low_stock_products: any[];
}

interface ClientStats {
  total_spent: number;
  total_orders: number;
  average_order: number;
  favorite_categories: { [key: string]: number };
  monthly_spending: { [key: string]: number };
  recent_orders: any[];
  order_status_distribution: { [key: string]: number };
}

export default function DashboardPage() {
  const { isAuthenticated, userRole } = useAuth();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState<string>('Usuario');
  
  const isAdmin = userRole === 'admin' || userRole === 'operator';
  const isClient = !isAdmin;

  useEffect(() => {
    fetchDashboardStats();
    
    // Actualizar reloj cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Simular estadísticas (puedes reemplazar con APIs reales)
      const mockStats: DashboardStats = {
        totalOrders: 156,
        totalRevenue: '45,230.50',
        totalProducts: 89,
        totalCustomers: 234,
        recentOrders: [
          { id: 1, customer: 'Juan Pérez', total: '125.50', status: 'DELIVERED' },
          { id: 2, customer: 'María García', total: '89.99', status: 'SHIPPED' },
          { id: 3, customer: 'Carlos López', total: '234.75', status: 'PROCESSING' },
        ],
        lowStockProducts: [
          { name: 'Laptop Gaming', stock: 3, sku: 'LAP001' },
          { name: 'Mouse Inalámbrico', stock: 5, sku: 'MOU002' },
          { name: 'Teclado Mecánico', stock: 2, sku: 'TEC003' },
        ]
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'SHIPPED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00BCD4] mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con saludo personalizado */}
      <div className="bg-gradient-to-r from-[#00BCD4] to-[#0097A7] text-white p-6 mb-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {getGreeting()}, {userName}! 👋
              </h1>
              <p className="text-lg opacity-90">
                Bienvenido al panel de control de SmartSales
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono">
                {currentTime.toLocaleTimeString('es-ES')}
              </div>
              <div className="text-sm opacity-75">
                {currentTime.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalOrders}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-3xl font-bold text-gray-900">Bs {stats?.totalRevenue}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Productos</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalProducts}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <span className="text-2xl">🛍️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalCustomers}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección principal con dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Accesos rápidos */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🚀 Accesos Rápidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gestión de Productos */}
              <Link href="/dashboard/products" className="group">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border hover:border-[#00BCD4]">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">📦</span>
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-[#00BCD4]">Productos</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Gestiona tu catálogo de productos, precios y categorías.</p>
                  <div className="text-[#00BCD4] font-medium group-hover:underline">Ver Productos →</div>
                </div>
              </Link>

              {/* Gestión de Pedidos */}
              <Link href="/dashboard/order-management" className="group">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border hover:border-[#00BCD4]">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">🛒</span>
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-[#00BCD4]">Pedidos</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Administra órdenes, estados y seguimiento de envíos.</p>
                  <div className="text-[#00BCD4] font-medium group-hover:underline">Gestionar Pedidos →</div>
                </div>
              </Link>

              {/* Inventario */}
              <Link href="/dashboard/inventory" className="group">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border hover:border-[#00BCD4]">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">📊</span>
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-[#00BCD4]">Inventario</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Controla el stock, movimientos y alertas de inventario.</p>
                  <div className="text-[#00BCD4] font-medium group-hover:underline">Ver Inventario →</div>
                </div>
              </Link>

              {/* Reportes */}
              <Link href="/dashboard/reports" className="group">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border hover:border-[#00BCD4]">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">📈</span>
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-[#00BCD4]">Reportes</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Genera reportes dinámicos con IA y reconocimiento de voz.</p>
                  <div className="text-[#00BCD4] font-medium group-hover:underline">Ver Reportes →</div>
                </div>
              </Link>

              {/* IA y Predicciones */}
              <Link href="/dashboard/ai" className="group">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border hover:border-[#00BCD4]">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">🤖</span>
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-[#00BCD4]">IA y Predicciones</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Machine Learning para predicciones de ventas y análisis.</p>
                  <div className="text-[#00BCD4] font-medium group-hover:underline">Ver Dashboard IA →</div>
                </div>
              </Link>

              {/* Garantías */}
              <Link href="/dashboard/warranties" className="group">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border hover:border-[#00BCD4]">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">🛡️</span>
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-[#00BCD4]">Garantías</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Gestiona garantías automáticas de 1 año por producto.</p>
                  <div className="text-[#00BCD4] font-medium group-hover:underline">Ver Garantías →</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Columna derecha - Información en tiempo real */}
          <div>
            {/* Órdenes recientes */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Órdenes Recientes</h3>
              <div className="space-y-3">
                {stats?.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">#{order.id}</p>
                      <p className="text-sm text-gray-600">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">Bs {order.total}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/order-management" className="block mt-4 text-center text-[#00BCD4] hover:underline">
                Ver todas las órdenes →
              </Link>
            </div>

            {/* Productos con stock bajo */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">⚠️ Stock Bajo</h3>
              <div className="space-y-3">
                {stats?.lowStockProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full font-bold">
                        {product.stock} unidades
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/inventory" className="block mt-4 text-center text-[#00BCD4] hover:underline">
                Ver inventario completo →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer con información adicional */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">🎉 SmartSales - Sistema Completo</h3>
            <p className="text-gray-600 mb-4">
              Plataforma integral de e-commerce con IA, gestión de inventario, reportes dinámicos y más.
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <span>✅ 26 Casos de Uso Implementados</span>
              <span>•</span>
              <span>🤖 IA y Machine Learning</span>
              <span>•</span>
              <span>🎤 Reconocimiento de Voz</span>
              <span>•</span>
              <span>📊 Reportes Dinámicos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
