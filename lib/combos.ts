import { supabase } from "./supabase";

export interface ComboItem {
  producto_id: string | null;
  nombre: string;
  cantidad: number;
  precio: number | null;
}

/** Combo de productos propuesto por el asistente y guardado por el usuario. */
export interface Combo {
  id: string;
  user_id: string;
  nombre: string;
  descripcion: string | null;
  items: ComboItem[];
  precio_total: number | null;
  created_at: string;
}

export async function obtenerCombos(userId: string): Promise<Combo[]> {
  const { data, error } = await supabase
    .from("combos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function guardarCombo(
  userId: string,
  nombre: string,
  descripcion: string | null,
  items: ComboItem[],
  precioTotal: number | null
): Promise<Combo> {
  const { data, error } = await supabase
    .from("combos")
    .insert({
      user_id: userId,
      nombre,
      descripcion,
      items,
      precio_total: precioTotal,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function eliminarCombo(id: string): Promise<void> {
  const { error } = await supabase.from("combos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
