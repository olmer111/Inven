import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Plan = "gratuito" | "pro" | "max";

export interface Perfil {
  id: string;
  email: string;
  plan: Plan;
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Con placeholders el cliente se construye igualmente para que la app
// compile y la demo funcione sin variables de entorno; las llamadas
// reales fallarán hasta configurar .env.local (ver .env.local.example).
export const supabase: SupabaseClient = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder-anon-key"
);
