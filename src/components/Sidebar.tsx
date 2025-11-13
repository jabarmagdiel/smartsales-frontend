// src/components/Sidebar.tsx

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getRoleFromToken } from '@/services/authService'; 
import { useRouter } from 'next/navigation';

const Sidebar: React.FC = () => {
  const { logout } = useAuth(); 
  const userRole = getRoleFromToken();
  const router = useRouter();

  // Estados para controlar las secciones colapsibles
  const [isClientSectionOpen, setIsClientSectionOpen] = useState(true);
  const [isAdminSectionOpen, setIsAdminSectionOpen] = useState(false);
  const [isSuperAdminSectionOpen, setIsSuperAdminSectionOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Definición de roles
  const isAdmin = userRole === 'Admin' || userRole === 'Administrador';
  const isOperator = userRole === 'Operador';

  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} h-screen bg-[#00BCD4] text-white flex flex-col shadow-lg transition-all duration-300`}>
      
      {/* Encabezado del Sidebar */}
      <div className="p-4 border-b border-teal-600 flex items-center justify-between">
        <div className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>
          <h1 className="text-xl font-bold text-white">SmartSales</h1>
          <p className="text-xs text-teal-100">Rol: {userRole || 'Desconocido'}</p>
        </div>
        
        {/* Botón para colapsar/expandir sidebar */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-2 rounded-md hover:bg-[#009688] transition-colors"
          title={isSidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {isSidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        
        {/* Dashboard Principal */}
        <Link 
          href="/dashboard" 
          className="flex items-center px-3 py-2 rounded-md hover:bg-[#009688] transition-colors"
          title="Dashboard Principal"
        >
          <span className="text-lg">🏠</span>
          {!isSidebarCollapsed && <span className="ml-3">Dashboard</span>}
        </Link>

        {/* SECCIÓN CLIENTE */}
        <div className="mb-2">
          <button
            onClick={() => setIsClientSectionOpen(!isClientSectionOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-teal-100 hover:bg-[#009688] rounded-md transition-colors"
            title="Sección Cliente"
          >
            <div className="flex items-center">
              <span className="text-base">👤</span>
              {!isSidebarCollapsed && <span className="ml-3">Cliente</span>}
            </div>
            {!isSidebarCollapsed && (
              <span className={`transform transition-transform ${isClientSectionOpen ? 'rotate-90' : ''}`}>
                ▶
              </span>
            )}
          </button>
          
          {(isClientSectionOpen || isSidebarCollapsed) && (
            <div className={`${isSidebarCollapsed ? 'hidden' : 'ml-4 mt-1 space-y-1'}`}>
              <Link href="/dashboard/shop" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                <span>🛒</span>
                <span className="ml-3">Tienda</span>
              </Link>
              <Link href="/dashboard/cart" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                <span>🛍️</span>
                <span className="ml-3">Mi Carrito</span>
              </Link>
              <Link href="/dashboard/profile" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                <span>👤</span>
                <span className="ml-3">Mi Perfil</span>
              </Link>
              <Link href="/dashboard/orders" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                <span>📦</span>
                <span className="ml-3">Mis Órdenes</span>
              </Link>
              <Link href="/dashboard/request-return" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                <span>🔄</span>
                <span className="ml-3">Solicitar Devolución</span>
              </Link>
              <Link href="/dashboard/warranties" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                <span>🛡️</span>
                <span className="ml-3">Mis Garantías</span>
              </Link>
              <Link href="/dashboard/my-analytics" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                <span>📊</span>
                <span className="ml-3">Mis Estadísticas</span>
              </Link>
            </div>
          )}
        </div>

        {/* SECCIÓN ADMINISTRACIÓN - Solo para Operadores y Admins */}
        {(isAdmin || isOperator) && (
          <div className="mb-2">
            <button
              onClick={() => setIsAdminSectionOpen(!isAdminSectionOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-teal-100 hover:bg-[#009688] rounded-md transition-colors"
              title="Sección Administración"
            >
              <div className="flex items-center">
                <span className="text-base">👨‍💼</span>
                {!isSidebarCollapsed && <span className="ml-3">Administración</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className={`transform transition-transform ${isAdminSectionOpen ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              )}
            </button>
            
            {(isAdminSectionOpen || isSidebarCollapsed) && (
              <div className={`${isSidebarCollapsed ? 'hidden' : 'ml-4 mt-1 space-y-1'}`}>
                <Link href="/dashboard/products" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>📦</span>
                  <span className="ml-3">Gestión de Productos</span>
                </Link>
                <Link href="/dashboard/inventory" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>📊</span>
                  <span className="ml-3">Control de Inventario</span>
                </Link>
                <Link href="/dashboard/order-management" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>🛍️</span>
                  <span className="ml-3">Gestión de Pedidos</span>
                </Link>
                <Link href="/dashboard/sales" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>💰</span>
                  <span className="ml-3">Ventas</span>
                </Link>
                <Link href="/dashboard/invoices" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>📄</span>
                  <span className="ml-3">Comprobantes</span>
                </Link>
                <Link href="/dashboard/users" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>👥</span>
                  <span className="ml-3">Gestión de Usuarios</span>
                </Link>
                <Link href="/dashboard/returns" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>🔄</span>
                  <span className="ml-3">Gestión de Devoluciones</span>
                </Link>
                <Link href="/dashboard/warranty-management" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>🛡️</span>
                  <span className="ml-3">Gestión de Garantías</span>
                </Link>
                <Link href="/dashboard/intelligent-reports" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>📊</span>
                  <span className="ml-3">Centro de Reportes Inteligente</span>
                </Link>
                <Link href="/dashboard/admin-analytics" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>📈</span>
                  <span className="ml-3">Dashboard Analytics</span>
                </Link>
                <Link href="/dashboard/system-logs" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>📋</span>
                  <span className="ml-3">Bitácora del Sistema</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN SOLO ADMINISTRADOR */}
        {isAdmin && (
          <div className="mb-2">
            <button
              onClick={() => setIsSuperAdminSectionOpen(!isSuperAdminSectionOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-teal-100 hover:bg-[#009688] rounded-md transition-colors"
              title="Sección Solo Administrador"
            >
              <div className="flex items-center">
                <span className="text-base">🔧</span>
                {!isSidebarCollapsed && <span className="ml-3">Solo Admin</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className={`transform transition-transform ${isSuperAdminSectionOpen ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              )}
            </button>
            
            {(isSuperAdminSectionOpen || isSidebarCollapsed) && (
              <div className={`${isSidebarCollapsed ? 'hidden' : 'ml-4 mt-1 space-y-1'}`}>
                <Link href="/dashboard/ai" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>🤖</span>
                  <span className="ml-3">IA y Predicciones</span>
                </Link>
                <Link href="/dashboard/reports-new" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>📊</span>
                  <span className="ml-3">Centro de Reportes</span>
                </Link>
                <Link href="/dashboard/reports" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>📈</span>
                  <span className="ml-3">Reportes Dinámicos</span>
                </Link>
                <Link href="/dashboard/logs" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>📋</span>
                  <span className="ml-3">Bitácora del Sistema</span>
                </Link>
                <Link href="/dashboard/backups" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[#009688] transition-colors">
                  <span>💾</span>
                  <span className="ml-3">Backups/Restore</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Menú colapsado - Mostrar iconos cuando está contraído */}
        {isSidebarCollapsed && (
          <div className="space-y-2 pt-4 border-t border-teal-500">
            {/* Iconos de Cliente */}
            <Link href="/dashboard/shop" className="flex justify-center p-2 rounded-md hover:bg-[#009688] transition-colors" title="Tienda">
              <span className="text-lg">🛒</span>
            </Link>
            <Link href="/dashboard/cart" className="flex justify-center p-2 rounded-md hover:bg-[#009688] transition-colors" title="Mi Carrito">
              <span className="text-lg">🛍️</span>
            </Link>
            <Link href="/dashboard/profile" className="flex justify-center p-2 rounded-md hover:bg-[#009688] transition-colors" title="Mi Perfil">
              <span className="text-lg">👤</span>
            </Link>
            <Link href="/dashboard/orders" className="flex justify-center p-2 rounded-md hover:bg-[#009688] transition-colors" title="Mis Órdenes">
              <span className="text-lg">📦</span>
            </Link>
            
            {/* Iconos de Administración */}
            {(isAdmin || isOperator) && (
              <>
                <Link href="/dashboard/products" className="flex justify-center p-2 rounded-md hover:bg-[#009688] transition-colors" title="Gestión de Productos">
                  <span className="text-lg">📦</span>
                </Link>
                <Link href="/dashboard/order-management" className="flex justify-center p-2 rounded-md hover:bg-[#009688] transition-colors" title="Gestión de Pedidos">
                  <span className="text-lg">🛍️</span>
                </Link>
                <Link href="/dashboard/sales" className="flex justify-center p-2 rounded-md hover:bg-[#009688] transition-colors" title="Ventas">
                  <span className="text-lg">💰</span>
                </Link>
              </>
            )}
            
            {/* Iconos de Solo Admin */}
            {isAdmin && (
              <>
                <Link href="/dashboard/ai" className="flex justify-center p-2 rounded-md hover:bg-[#009688] transition-colors" title="IA y Predicciones">
                  <span className="text-lg">🤖</span>
                </Link>
                <Link href="/dashboard/reports-new" className="flex justify-center p-2 rounded-md hover:bg-[#009688] transition-colors" title="Centro de Reportes">
                  <span className="text-lg">📊</span>
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Botón de Logout */}
      <div className="p-4 border-t border-teal-600">
        <button
          onClick={handleLogout} 
          className="w-full py-2 px-4 rounded-md font-semibold text-white bg-[#FF9800] hover:bg-[#FB8C00] transition duration-150 flex items-center justify-center"
          title="Cerrar Sesión"
        >
          <span className="text-lg">🚪</span>
          {!isSidebarCollapsed && <span className="ml-2">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;