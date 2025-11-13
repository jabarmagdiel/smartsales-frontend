"use client";

import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";

interface Profile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string | null;
  address?: string | null;
}

interface ProfileUpdateData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
}

export default function DashboardProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados para el formulario de edición
  const [formData, setFormData] = useState<ProfileUpdateData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<Profile>("/perfil/");
        setProfile(res.data);
        // Inicializar el formulario con los datos actuales
        setFormData({
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } catch (e: any) {
        setError(e?.response?.data?.detail || "Error cargando perfil");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Preparar datos para enviar (sin campos de contraseña si no se está cambiando)
      const updateData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null
      };

      // Si está cambiando contraseña, validar y agregar campos
      if (isChangingPassword) {
        if (!formData.current_password) {
          setError('Debe ingresar su contraseña actual');
          return;
        }
        if (!formData.new_password || formData.new_password.length < 6) {
          setError('La nueva contraseña debe tener al menos 6 caracteres');
          return;
        }
        if (formData.new_password !== formData.confirm_password) {
          setError('Las contraseñas no coinciden');
          return;
        }
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
      }

      const res = await apiClient.patch<Profile>("/perfil/", updateData);
      setProfile(res.data);
      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
      setIsChangingPassword(false);
      
      // Limpiar campos de contraseña
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.response?.data?.error || "Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    }
    setIsEditing(false);
    setIsChangingPassword(false);
    setError(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center p-10">
      <p className="text-lg text-gray-600">Cargando perfil...</p>
    </div>
  );

  if (error && !profile) return (
    <div className="flex items-center justify-center p-10">
      <p className="text-lg text-red-600 bg-red-100 p-4 rounded-md border border-red-300">{error}</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestionar Perfil (CU5)</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-[#00BCD4] hover:bg-[#0097A7] text-white font-semibold py-2 px-4 rounded-md"
          >
            Editar Perfil
          </button>
        )}
      </div>

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

      {profile && (
        <div className="bg-white shadow-md rounded-lg p-6">
          {!isEditing ? (
            // Vista de solo lectura
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Usuario</label>
                  <p className="text-lg text-gray-900">{profile.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Rol</label>
                  <p className="text-lg text-gray-900">{profile.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <p className="text-lg text-gray-900">{profile.first_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Apellido</label>
                  <p className="text-lg text-gray-900">{profile.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg text-gray-900">{profile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Teléfono</label>
                  <p className="text-lg text-gray-900">{profile.phone || 'No especificado'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Dirección</label>
                <p className="text-lg text-gray-900">{profile.address || 'No especificada'}</p>
              </div>
            </div>
          ) : (
            // Vista de edición
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Apellido</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                    placeholder="Ej: +591 70123456"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                  placeholder="Ej: Av. Principal 123, Zona Central, La Paz"
                />
              </div>

              {/* Sección de cambio de contraseña */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Cambiar Contraseña</h3>
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    className="text-sm text-[#00BCD4] hover:text-[#0097A7]"
                  >
                    {isChangingPassword ? 'Cancelar cambio' : 'Cambiar contraseña'}
                  </button>
                </div>
                
                {isChangingPassword && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contraseña Actual</label>
                      <input
                        type="password"
                        name="current_password"
                        value={formData.current_password}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        required={isChangingPassword}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
                      <input
                        type="password"
                        name="new_password"
                        value={formData.new_password}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        required={isChangingPassword}
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirmar Nueva Contraseña</label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        required={isChangingPassword}
                        minLength={6}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-[#00BCD4] hover:bg-[#0097A7] text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
