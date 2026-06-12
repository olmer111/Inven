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
  // UPDATE (no upsert) porque la fila ya existe: el trigger la crea al registrarse.
  await supabase
    .from("perfiles")
    .update({ nombre_display: nombre })
    .eq("id", userId);
}
