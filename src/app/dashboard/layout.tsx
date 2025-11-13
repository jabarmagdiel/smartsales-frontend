// src/app/dashboard/layout.tsx

'use client'; // Requerido para hooks de cliente (useAuth, useEffect)

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar'; // Usa tu ruta de Sidebar existente
import CartDrawer from '@/components/CartDrawer';
import { getCart, type CartResp } from '@/services/cartService';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);

  // Sincroniza contador global del carrito
  useEffect(() => {
    const sync = async () => {
      try {
        const cart = await getCart();
        const count = (cart.items || []).reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };
    sync();
    const handler = () => sync();
    if (typeof window !== 'undefined') {
      window.addEventListener('cart-updated', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cart-updated', handler);
      }
    };
  }, []);

  // EFECTO DE SEGURIDAD (Protección de Ruta)
  useEffect(() => {
    // Si el contexto dice que NO está autenticado, lo patea al login.
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // No renderiza nada si no está autenticado (evita flash de contenido)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Cargando...</p>
      </div>
    );
  }

  // Renderiza el Layout si SÍ está autenticado
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 1. El Sidebar (Navegación) */}
      <Sidebar />

      {/* 2. El Contenido Principal (Responsivo) */}
      <main className="flex-1 p-0 md:p-0">
        {/* Topbar */}
        <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b bg-white">
          <div className="font-semibold text-gray-900">Panel</div>
          <div className="space-x-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="bg-[#00BCD4] hover:bg-[#0097A7] text-white text-sm py-2 px-3 rounded relative"
            >
              🛒 Ver Carrito
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Drawer global */}
      <CartDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cart-updated')); }} />
    </div>
  );
}