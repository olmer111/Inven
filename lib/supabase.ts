import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Plan = "gratuito" | "pro" | "max";

export interface Perfil {
  id: string;
  email: string;
  plan: Plan;
  nombre_display?: string | null;
  created_at: string;
}

export interface Producto {
  id: string;
  user_id: string;
  codigo: string;
  nombre: string;
  categoria: string | null;
  imagen_url: string | null;
  cantidad: number;
  descripcion: string | null;
  especificaciones: string[] | null;
  precio: number | null;
  created_at: string;
}

/** Producto que un cliente pidió y no tenemos: recordatorio de compra. */
export interface Pedido {
  id: string;
  user_id: string;
  nombre: string;
  notas: string | null;
  created_at: string;
}

export const PLANES: Record<
  Plan,
  { nombre: string; precio: string; limite: number | null; rasgos: string[] }
> = {
  gratuito: {
    nombre: "Gratuito",
    precio: "€0",
    limite: 30,
    rasgos: ["30 productos", "Escaneo con cámara", "Búsqueda automática"],
  },
  pro: {
    nombre: "Pro",
    precio: "€9.99",
    limite: 500,
    rasgos: ["500 productos", "Exportar a CSV", "Todo lo del plan Gratuito"],
  },
  max: {
    nombre: "Max",
    precio: "€24.99",
    limite: null,
    rasgos: [
      "Productos ilimitados",
      "Multi-usuario",
      "Estadísticas",
      "Todo lo del plan Pro",
    ],
  },
};

// La clave anónima de Supabase es pública por diseño (los datos se protegen
// con RLS), así que puede ir en el código. Las variables de entorno solo se
// usan si vienen LAS DOS y la clave tiene el formato JWT (eyJ…) que acepta
// supabase-js: integraciones como la de Vercel inyectan claves nuevas
// (sb_publishable_…) que romperían el login si las usáramos.
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const usarEnv = Boolean(envUrl && envKey && envKey.startsWith("eyJ"));

const url = usarEnv ? envUrl! : "https://ylufjnytawsgklikkhhn.supabase.co";
const anonKey = usarEnv
  ? envKey!
  : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdWZqbnl0YXdzZ2tsaWtraGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMzM0NzYsImV4cCI6MjA5NjgwOTQ3Nn0.obZ9jPqGFE0x5KPzN_w7leT4e-6lNbF2XsLu_T-5HBs";

export const isSupabaseConfigured = true;

export const supabase: SupabaseClient = createClient(url, anonKey);
