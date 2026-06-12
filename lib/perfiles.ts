import { supabase } from "./supabase";

export async function obtenerNombreDisplay(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("perfiles")
    .select("nombre_display")
    .eq("id", userId)
    .single();
  return data?.nombre_display ?? null;
}

export async function guardarNombreDisplay(userId: string, nombre: string): Promise<void> {
  await supabase
    .from("perfiles")
    .upsert({ id: userId, nombre_display: nombre });
}
