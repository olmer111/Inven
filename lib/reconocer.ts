import { obtenerConfigIA } from "./configuracion";

export interface ProductoReconocido {
  reconocido: boolean;
  nombre: string;
  categoria: string;
  descripcion: string;
  especificaciones: string[];
}

/** Envía una o varias fotos (data URLs, p. ej. distintos ángulos del mismo
    producto) a /api/reconocer usando el proveedor configurado. */
export async function reconocerProducto(
  imagenes: string | string[]
): Promise<ProductoReconocido> {
  const lista = Array.isArray(imagenes) ? imagenes : [imagenes];
  const config = obtenerConfigIA();
  const { proveedor } = config;

  const modelo = config[proveedor].modelo;
  const apiKey =
    proveedor === "anthropic"
      ? config.anthropic.apiKey || undefined
      : proveedor === "openrouter"
        ? config.openrouter.apiKey || undefined
        : undefined;
  const baseUrl =
    proveedor === "ollama" ? config.ollama.baseUrl : undefined;

  const res = await fetch("/api/reconocer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imagen: lista[0],
      imagenes: lista,
      proveedor,
      modelo,
      ...(apiKey && { apiKey }),
      ...(baseUrl && { baseUrl }),
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "No se pudo reconocer el producto.");
  }
  return data as ProductoReconocido;
}

/** Código interno para productos sin código de barras ni QR. */
export function generarCodigoInterno(): string {
  return `SC-${Date.now().toString(36).toUpperCase()}`;
}
