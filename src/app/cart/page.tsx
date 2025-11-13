"use client";

import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import { removeFromCart, checkout, pay, type CartResp } from "@/services/cartService";

interface CartItem {
  id: number;
  product: { id: number; name?: string; nombre?: string; sku: string; };
  quantity: number;
  price: string;
}

export default function CartPage() {
  const [data, setData] = useState<CartResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [method, setMethod] = useState<'PAYPAL' | 'STRIPE' | 'CASH'>('CASH');
  const [step, setStep] = useState<'cart' | 'checkout' | 'payment'>('cart');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<CartResp>("/carrito/");
        setData(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.detail || "Error cargando carrito");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRemove = async (productId: number) => {
    try {
      const updated = await removeFromCart(productId);
      setData(updated);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "No se pudo eliminar");
    }
  };

  const handleProceedToCheckout = () => {
    setError(null);
    setStep('checkout');
  };

  const handleCheckout = async () => {
    if (!address.trim()) {
      setError('Por favor ingresa una dirección de envío');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      const res = await checkout(address.trim());
      setOrderId(res.id);
      setStep('payment');
      setInfo(`Orden #${res.id} creada exitosamente. Selecciona tu método de pago.`);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "No se pudo procesar checkout");
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    if (!orderId) return;
    
    try {
      setProcessing(true);
      setError(null);
      const res = await pay(orderId, method);
      setInfo(`¡Pago procesado exitosamente! Estado: ${res.status}`);
      
      // Refrescar carrito después del pago exitoso
      setTimeout(async () => {
        const cart = await apiClient.get<CartResp>("/carrito/");
        setData(cart.data);
        setStep('cart');
        setOrderId(null);
      }, 2000);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al procesar el pago");
    } finally {
      setProcessing(false);
    }
  };

  const handleBackToCart = () => {
    setStep('cart');
    setError(null);
    setInfo(null);
  };

  const handleBackToCheckout = () => {
    setStep('checkout');
    setError(null);
  };

  if (loading) return <div className="p-6">Cargando carrito...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con progreso */}
      <div className="bg-gradient-to-r from-[#00BCD4] to-[#0097A7] text-white p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-4">🛍️ Mi Carrito</h1>
          
          {/* Indicador de progreso */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step === 'cart' ? 'text-white' : 'text-teal-200'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'cart' ? 'bg-white text-[#00BCD4]' : 'bg-teal-600'}`}>1</span>
              <span className="ml-2">Carrito</span>
            </div>
            <div className="flex-1 h-1 bg-teal-600 mx-2"></div>
            <div className={`flex items-center ${step === 'checkout' ? 'text-white' : 'text-teal-200'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'checkout' ? 'bg-white text-[#00BCD4]' : 'bg-teal-600'}`}>2</span>
              <span className="ml-2">Checkout</span>
            </div>
            <div className="flex-1 h-1 bg-teal-600 mx-2"></div>
            <div className={`flex items-center ${step === 'payment' ? 'text-white' : 'text-teal-200'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'payment' ? 'bg-white text-[#00BCD4]' : 'bg-teal-600'}`}>3</span>
              <span className="ml-2">Pago</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Mensajes */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}
        {info && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            ✅ {info}
          </div>
        )}

        {/* PASO 1: CARRITO */}
        {step === 'cart' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Productos en tu carrito</h2>
            
            {data && data.items && data.items.length > 0 ? (
              <div className="space-y-4">
                {data.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      {((it as any).product?.image) ? (
                        <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={(it as any).product.image as string} alt={(it as any).product.nombre || (it as any).product.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">Sin imagen</div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{it.product.nombre || it.product.name}</h3>
                        <p className="text-gray-600">SKU: {it.product.sku}</p>
                        <p className="text-gray-600">Cantidad: {it.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-xl font-bold text-[#00BCD4]">Bs {it.price}</div>
                      <button
                        onClick={() => handleRemove(it.product.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4 mt-6">
                  <div className="flex justify-between items-center">
                    <div className="text-2xl font-bold">Total: Bs {data.total}</div>
                    <button
                      onClick={handleProceedToCheckout}
                      className="bg-[#00BCD4] hover:bg-[#0097A7] text-white py-3 px-6 rounded-lg text-lg font-semibold transition-colors"
                    >
                      Proceder al Checkout →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Tu carrito está vacío</h3>
                <p className="text-gray-500">Agrega algunos productos para continuar</p>
              </div>
            )}
          </div>
        )}

        {/* PASO 2: CHECKOUT */}
        {step === 'checkout' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Información de envío</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección de envío *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Av. Principal 123, Ciudad, País"
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={handleBackToCart}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  ← Volver al Carrito
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={processing || !address.trim()}
                  className="bg-[#00BCD4] hover:bg-[#0097A7] text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? '⏳ Procesando...' : 'Continuar al Pago →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: PAGO */}
        {step === 'payment' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Selecciona tu método de pago</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Método de pago *
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div
                    onClick={() => setMethod('PAYPAL')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      method === 'PAYPAL' 
                        ? 'border-[#00BCD4] bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="payment"
                        value="PAYPAL"
                        checked={method === 'PAYPAL'}
                        onChange={() => setMethod('PAYPAL')}
                        className="text-[#00BCD4]"
                      />
                      <div>
                        <div className="font-semibold">💙 PayPal</div>
                        <div className="text-sm text-gray-600">Pago seguro con PayPal</div>
                      </div>
                    </div>
                  </div>
                  
                  <div
                    onClick={() => setMethod('STRIPE')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      method === 'STRIPE' 
                        ? 'border-[#00BCD4] bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="payment"
                        value="STRIPE"
                        checked={method === 'STRIPE'}
                        onChange={() => setMethod('STRIPE')}
                        className="text-[#00BCD4]"
                      />
                      <div>
                        <div className="font-semibold">💜 Stripe</div>
                        <div className="text-sm text-gray-600">Tarjeta de crédito/débito</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Resumen del pedido:</h3>
                <p className="text-gray-600">Orden #{orderId}</p>
                <p className="text-gray-600">Dirección: {address}</p>
                <p className="text-lg font-bold text-[#00BCD4]">Total: Bs {data?.total}</p>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={handleBackToCheckout}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  ← Volver al Checkout
                </button>
                <button
                  onClick={handlePay}
                  disabled={processing}
                  className="bg-[#FF9800] hover:bg-[#FB8C00] text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? '⏳ Procesando Pago...' : `💳 Pagar con ${method === 'PAYPAL' ? 'PayPal' : 'Stripe'}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
