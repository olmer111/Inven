import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Proveedor } from "@/lib/configuracion";

export const runtime = "nodejs";
export const maxDuration = 60;

const ReconocimientoSchema = z.object({
  reconocido: z
    .boolean()
    .describe("false si la imagen no muestra un producto identificable"),
  nombre: z.string().describe("Nombre comercial del producto, en español"),
  categoria: z
    .string()
    .describe("Categoría corta del producto en minúsculas, ej. 'bebidas'"),
  descripcion: z
    .string()
    .describe(
      "Qué es y para qué sirve, en 1-2 frases en español dirigidas a un cliente"
    ),
  especificaciones: z
    .array(z.string())
    .describe(
      "3-5 especificaciones visibles o típicas: tamaño, material, formato, marca, variante"
    ),
});

type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

const SYSTEM_JSON = `Eres un asistente de inventario de tienda. Analiza la imagen y responde ÚNICAMENTE con un objeto JSON válido con este esquema exacto, sin texto adicional:
{"reconocido":boolean,"nombre":"string","categoria":"string","descripcion":"string","especificaciones":["string"]}
Donde:
- reconocido: false si no hay un producto claro en la imagen
- nombre: nombre comercial en español
- categoria: categoría corta en minúsculas (ej. "bebidas", "limpieza", "alimentación")
- descripcion: qué es y para qué sirve, 1-2 frases en español para un cliente
- especificaciones: array con 3-5 specs visibles (tamaño, material, marca, variante, etc.)`;

function extraerJSON(texto: string): Record<string, unknown> {
  try {
    return JSON.parse(texto.trim());
  } catch {}
  const match = texto.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }
  throw new Error("Sin JSON válido en la respuesta");
}

function normalizar(raw: Record<string, unknown>) {
  return {
    reconocido: Boolean(raw.reconocido),
    nombre: String(raw.nombre || "Producto desconocido"),
    categoria: String(raw.categoria || ""),
    descripcion: String(raw.descripcion || ""),
    especificaciones: Array.isArray(raw.especificaciones)
      ? raw.especificaciones.map(String)
      : [],
  };
}

function separarDataUrl(imagen: string): { datos: string; mediaType: MediaType } {
  const [cabecera, datos] = imagen.split(",", 2);
  const mediaType = (cabecera.match(
    /^data:(image\/(?:jpeg|png|webp|gif))/
  )?.[1] ?? "image/jpeg") as MediaType;
  return { datos, mediaType };
}

async function usarAnthropic(
  imagenes: string[],
  modelo: string,
  apiKey?: string
): Promise<NextResponse> {
  const clave = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!clave) {
    return NextResponse.json(
      {
        error:
          "Sin clave API de Anthropic. Añádela en Configuración → Modelo de IA, o configura ANTHROPIC_API_KEY en el servidor.",
      },
      { status: 503 }
    );
  }

  const client = new Anthropic({ apiKey: clave });
  try {
    const response = await client.messages.parse({
      model: modelo,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            ...imagenes.map((img) => {
              const { datos, mediaType } = separarDataUrl(img);
              return {
                type: "image" as const,
                source: {
                  type: "base64" as const,
                  media_type: mediaType,
                  data: datos,
                },
              };
            }),
            {
              type: "text",
              text:
                imagenes.length > 1
                  ? "Las fotos muestran EL MISMO producto desde distintos ángulos. Identifícalo para el inventario de una tienda combinando la información de todas. Si no hay un producto claro, marca reconocido=false."
                  : "Identifica el producto de la foto para el inventario de una tienda. Si no hay un producto claro, marca reconocido=false.",
            },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(ReconocimientoSchema) },
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return NextResponse.json(
        { error: "No se pudo analizar la imagen. Prueba con otra foto." },
        { status: 422 }
      );
    }
    return NextResponse.json(response.parsed_output);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Demasiadas peticiones seguidas. Espera unos segundos." },
        { status: 429 }
      );
    }
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Error de Anthropic (${e.status}). Inténtalo de nuevo.` },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "Error inesperado al reconocer el producto." },
      { status: 500 }
    );
  }
}

async function usarOAICompat(
  imagenes: string[],
  modelo: string,
  apiBase: string,
  apiKey?: string,
  extraHeaders?: Record<string, string>
): Promise<NextResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  let res: Response;
  try {
    res = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelo,
        messages: [
          { role: "system", content: SYSTEM_JSON },
          {
            role: "user",
            content: [
              ...imagenes.map((url) => ({
                type: "image_url" as const,
                image_url: { url },
              })),
              {
                type: "text",
                text:
                  imagenes.length > 1
                    ? "Las fotos muestran el mismo producto desde varios ángulos. Identifícalo para el inventario de una tienda."
                    : "Identifica este producto para el inventario de una tienda.",
              },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(55000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de red";
    return NextResponse.json(
      { error: `No se pudo conectar al proveedor: ${msg}` },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    // Los proveedores devuelven JSON con el mensaje anidado; lo extraemos
    // para mostrar algo legible en la interfaz.
    let detalle = errText.slice(0, 200);
    try {
      const parsed = JSON.parse(errText);
      detalle =
        parsed?.error?.message ?? parsed?.message ?? detalle;
    } catch {}
    if (res.status === 404) {
      detalle += " — Elige otro modelo en Configuración → Modelo de IA.";
    }
    if (res.status === 401) {
      detalle =
        "Clave API no válida. Vuelve a conectar el proveedor en Configuración.";
    }
    if (res.status === 429) {
      detalle =
        "Límite de uso alcanzado en este modelo. Espera un poco o elige otro modelo en Configuración.";
    }
    return NextResponse.json(
      { error: `Error del proveedor: ${detalle}` },
      { status: 502 }
    );
  }

  let completion: { choices?: { message?: { content?: string } }[] };
  try {
    completion = await res.json();
  } catch {
    return NextResponse.json(
      { error: "Respuesta inválida del proveedor." },
      { status: 502 }
    );
  }

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "El modelo no devolvió contenido." },
      { status: 502 }
    );
  }

  try {
    return NextResponse.json(normalizar(extraerJSON(content)));
  } catch {
    return NextResponse.json(
      { error: "El modelo no devolvió JSON válido. Prueba con otro modelo." },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  let imagenes: string[];
  let proveedor: Proveedor = "anthropic";
  let modelo = "claude-opus-4-8";
  let apiKey: string | undefined;
  let baseUrl: string | undefined;

  try {
    const body = await request.json();
    const lista: unknown[] = Array.isArray(body.imagenes)
      ? body.imagenes
      : [body.imagen];
    if (
      lista.length === 0 ||
      lista.some((i) => typeof i !== "string" || !i.startsWith("data:image/"))
    ) {
      throw new Error();
    }
    imagenes = (lista as string[]).slice(0, 3);
    if (body.proveedor) proveedor = body.proveedor;
    if (body.modelo) modelo = body.modelo;
    if (body.apiKey) apiKey = body.apiKey;
    if (body.baseUrl) baseUrl = body.baseUrl;
  } catch {
    return NextResponse.json(
      { error: "Envía la imagen como data URL en el campo «imagen»." },
      { status: 400 }
    );
  }

  if (proveedor === "ollama") {
    const base =
      (baseUrl ?? "http://localhost:11434").replace(/\/+$/, "") + "/v1";
    return usarOAICompat(imagenes, modelo, base);
  }

  if (proveedor === "openrouter") {
    const clave = apiKey || process.env.OPENROUTER_API_KEY;
    if (!clave) {
      return NextResponse.json(
        {
          error:
            "Necesitas una clave API de OpenRouter. Configúrala en Configuración → Modelo de IA, o añade OPENROUTER_API_KEY en el servidor.",
        },
        { status: 503 }
      );
    }
    return usarOAICompat(imagenes, modelo, "https://openrouter.ai/api/v1", clave, {
      "HTTP-Referer": "https://stockscan.app",
      "X-Title": "StockScan",
    });
  }

  return usarAnthropic(imagenes, modelo, apiKey);
}
