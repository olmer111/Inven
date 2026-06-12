import { obtenerConfigIA } from "./configuracion";
import type { Producto } from "./supabase";
import type { Pedido } from "./supabase";

export interface MensajeChat {
  rol: "usuario" | "asistente";
  contenido: string;
}

export interface ComboPropuesto {
  nombre: string;
  descripcion: string;
  items: { codigo: string; nombre: string; cantidad: number; precio: number | null }[];
  precio_total: number | null;
}

export type ParteRespuesta = string | ComboPropuesto;

/** Envía el historial al endpoint /api/asistente y devuelve el texto de respuesta. */
export async function enviarMensajeAsistente(
  mensajes: MensajeChat[],
  productos: Producto[],
  pedidos: Pedido[]
): Promise<string> {
  const config = obtenerConfigIA();
  const { proveedor } = config;
  const modelo = config[proveedor].modelo;
  const apiKey =
    proveedor === "anthropic"
      ? config.anthropic.apiKey || undefined
      : proveedor === "openrouter"
        ? config.openrouter.apiKey || undefined
        : undefined;
  const baseUrl = proveedor === "ollama" ? config.ollama.baseUrl : undefined;

  const res = await fetch("/api/asistente", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mensajes,
      productos,
      pedidos,
      proveedor,
      modelo,
      ...(apiKey && { apiKey }),
      ...(baseUrl && { baseUrl }),
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "No se pudo conectar con el asistente.");
  return data.respuesta as string;
}

const COMBO_RE = /```combo\s*([\s\S]*?)```/g;

/**
 * Divide el texto de respuesta en partes: strings y objetos ComboPropuesto.
 * Si el JSON de un bloque combo falla, el bloque se incluye como texto plano.
 */
export function parseCombos(texto: string): ParteRespuesta[] {
  const partes: ParteRespuesta[] = [];
  let ultimo = 0;
  let match: RegExpExecArray | null;
  COMBO_RE.lastIndex = 0;

  while ((match = COMBO_RE.exec(texto)) !== null) {
    if (match.index > ultimo) {
      partes.push(texto.slice(ultimo, match.index));
    }
    try {
      const obj = JSON.parse(match[1].trim()) as ComboPropuesto;
      if (obj && typeof obj === "object" && obj.nombre) {
        partes.push(obj);
      } else {
        partes.push(match[0]);
      }
    } catch {
      partes.push(match[0]);
    }
    ultimo = match.index + match[0].length;
  }

  if (ultimo < texto.length) {
    partes.push(texto.slice(ultimo));
  }

  return partes.filter((p) => typeof p !== "string" || p.trim().length > 0);
}
