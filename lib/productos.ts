import { supabase, PLANES, type Plan, type Producto } from "./supabase";

export interface ProductoEscaneado {
  codigo: string;
  nombre: string;
  categoria: string | null;
  imagen_url: string | null;
  descripcion: string | null;
  especificaciones: string[] | null;
}

/** Busca un código de barras en Open Food Facts. Devuelve null si no existe. */
export async function buscarProductoPorCodigo(
  codigo: string
): Promise<ProductoEscaneado | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
        codigo
      )}.json?fields=product_name,image_url,categories_tags_es,categories_tags`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const tags: string[] =
      data.product.categories_tags_es ?? data.product.categories_tags ?? [];
    const categoria = tags.length
      ? tags[tags.length - 1].replace(/^[a-z]{2}:/, "").replace(/-/g, " ")
      : null;

    return {
      codigo,
      nombre: data.product.product_name || `Producto ${codigo}`,
      categoria,
      imagen_url: data.product.image_url ?? null,
      descripcion: null,
      especificaciones: null,
    };
  } catch {
    return null;
  }
}

export async function obtenerProductos(userId: string): Promise<Producto[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function agregarProducto(
  userId: string,
  producto: ProductoEscaneado,
  cantidad: number
): Promise<Producto> {
  const { data, error } = await supabase
    .from("productos")
    .insert({
      user_id: userId,
      codigo: producto.codigo,
      nombre: producto.nombre,
      categoria: producto.categoria,
      imagen_url: producto.imagen_url,
      descripcion: producto.descripcion,
      especificaciones: producto.especificaciones,
      cantidad,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function actualizarCantidad(
  id: string,
  cantidad: number
): Promise<void> {
  const { error } = await supabase
    .from("productos")
    .update({ cantidad })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function eliminarProducto(id: string): Promise<void> {
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function filtrarProductos(
  productos: Producto[],
  consulta: string
): Producto[] {
  const q = consulta.trim().toLowerCase();
  if (!q) return productos;
  return productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(q) ||
      (p.categoria ?? "").toLowerCase().includes(q) ||
      p.codigo.includes(q)
  );
}

export function limiteDelPlan(plan: Plan): number | null {
  return PLANES[plan].limite;
}

export function puedeExportarCSV(plan: Plan): boolean {
  return plan === "pro" || plan === "max";
}

export function exportarCSV(productos: Producto[]): void {
  const escapar = (v: string | number | null) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;
  const filas = [
    ["Código", "Nombre", "Categoría", "Cantidad", "Añadido"].join(","),
    ...productos.map((p) =>
      [
        escapar(p.codigo),
        escapar(p.nombre),
        escapar(p.categoria),
        p.cantidad,
        escapar(new Date(p.created_at).toLocaleDateString("es-ES")),
      ].join(",")
    ),
  ];
  const blob = new Blob(["﻿" + filas.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stockscan-inventario-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
