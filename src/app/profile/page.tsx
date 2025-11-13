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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<Profile>("/perfil/");
        setProfile(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.detail || "Error cargando perfil");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6">Cargando perfil...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Perfil</h1>
      {profile && (
        <div className="bg-white shadow rounded p-4 space-y-2">
          <div><span className="font-semibold">Usuario:</span> {profile.username}</div>
          <div><span className="font-semibold">Nombre:</span> {profile.first_name} {profile.last_name}</div>
          <div><span className="font-semibold">Email:</span> {profile.email}</div>
          <div><span className="font-semibold">Rol:</span> {profile.role}</div>
          <div><span className="font-semibold">Teléfono:</span> {profile.phone || '-'}</div>
          <div><span className="font-semibold">Dirección:</span> {profile.address || '-'}</div>
        </div>
      )}
    </div>
  );
}
