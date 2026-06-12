import { supabase, type Pedido } from "./supabase";

export async function obtenerPedidos(userId: string): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function agregarPedido(
  userId: string,
  nombre: string,
  notas: string | null
): Promise<Pedido> {
  const { data, error } = await supabase
    .from("pedidos")
    .insert({ user_id: userId, nombre, notas })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function eliminarPedido(id: string): Promise<void> {
  const { error } = await supabase.from("pedidos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
