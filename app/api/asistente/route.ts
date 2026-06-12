import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Proveedor } from "@/lib/configuracion";
import type { Producto } from "@/lib/supabase";
import type { Pedido } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

interface MensajeChat {
  rol: "usuario" | "asistente";
  contenido: string;
}

function construirSystemPrompt(productos: Producto[], pedidos: Pedido[]): string {
  const hoy = new Date().toLocaleDateString("es-CO", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const listaProductos = productos
    .slice(0, 200)
    .map((p) => {
      const precio = p.precio != null ? `$${p.precio.toLocaleString("es-CO")} COP` : "sin precio";
      const desc = p.descripcion ? ` — ${p.descripcion}` : "";
      return `- ${p.nombre} | código: ${p.codigo} | categoría: ${p.categoria ?? "—"} | stock: ${p.cantidad} | precio: ${precio}${desc}`;
    })
    .join("\n");

  const extra =
    productos.length > 200
      ? `\n…y ${productos.length - 200} productos más no listados.`
      : "";

  const listaPedidos =
    pedidos.length === 0
      ? "Ninguno"
      : pedidos.map((p) => `- ${p.nombre}${p.notas ? `: ${p.notas}` : ""}`).join("\n");

  return `Eres el asistente de StockScan, una app de inventario para una tienda en Colombia.
Hoy es ${hoy}. Responde SIEMPRE en español, de forma breve y práctica.

INVENTARIO ACTUAL (${productos.length} productos):
${listaProductos}${extra}

PEDIDOS PENDIENTES DE CLIENTES:
${listaPedidos}

Tus capacidades:
1. Responder preguntas sobre stock ("¿cuántas X hay?") usando SOLO los datos del inventario. Si un producto no existe, dilo claramente.
2. Recomendar combos de productos del inventario (ej. "combo para la gripa") usando únicamente productos con stock > 0.
3. Calcular presupuestos en pesos colombianos (COP) sumando los precios. Muestra el desglose por unidad y el total. Si un producto no tiene precio, inclúyelo pero avisa que falta su precio y exclúyelo del total.
4. No inventes productos, precios ni cantidades que no estén en los datos anteriores.

Cuando propongas un combo, además de explicarlo en texto, emite EXACTAMENTE un bloque con este formato para que la app pueda guardarlo:

\`\`\`combo
{"nombre":"Combo para la gripa","descripcion":"Productos recomendados para aliviar la gripa","items":[{"codigo":"8480000123456","nombre":"Paracetamol 500mg","cantidad":2,"precio":8000}],"precio_total":16000}
\`\`\`

Usa solo códigos que existan en el inventario. "precio_total" debe ser null si falta el precio de algún ítem.`;
}

async function usarAnthropic(
  mensajes: MensajeChat[],
  systemPrompt: string,
  modelo: string,
  apiKey?: string
): Promise<NextResponse> {
  const clave = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!clave) {
    return NextResponse.json(
      { error: "Sin clave API de Anthropic. Añádela en Configuración → Modelo de IA, o configura ANTHROPIC_API_KEY en el servidor." },
      { status: 503 }
    );
  }

  const client = new Anthropic({ apiKey: clave });
  try {
    const response = await client.messages.create({
      model: modelo,
      max_tokens: 2048,
      system: systemPrompt,
      messages: mensajes.map((m) => ({
        role: m.rol === "usuario" ? "user" : "assistant",
        content: m.contenido,
      })),
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "El asistente no pudo responder esta pregunta. Inténtalo de otra forma." },
        { status: 422 }
      );
    }

    const bloque = response.content.find((b) => b.type === "text");
    if (!bloque || bloque.type !== "text") {
      return NextResponse.json({ error: "El modelo no devolvió contenido." }, { status: 502 });
    }
    return NextResponse.json({ respuesta: bloque.text });
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
    return NextResponse.json({ error: "Error inesperado al conectar con el asistente." }, { status: 500 });
  }
}

async function usarOAICompat(
  mensajes: MensajeChat[],
  systemPrompt: string,
  modelo: string,
  apiBase: string,
  apiKey?: string,
  extraHeaders?: Record<string, string>
): Promise<NextResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extraHeaders };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  let res: Response;
  try {
    res = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelo,
        messages: [
          { role: "system", content: systemPrompt },
          ...mensajes.map((m) => ({
            role: m.rol === "usuario" ? "user" : "assistant",
            content: m.contenido,
          })),
        ],
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(55000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de red";
    return NextResponse.json({ error: `No se pudo conectar al proveedor: ${msg}` }, { status: 502 });
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    let detalle = errText.slice(0, 200);
    try {
      const parsed = JSON.parse(errText);
      detalle = parsed?.error?.message ?? parsed?.message ?? detalle;
    } catch {}
    if (res.status === 404) detalle += " — Elige otro modelo en Configuración → Modelo de IA.";
    if (res.status === 401) detalle = "Clave API no válida. Vuelve a conectar el proveedor en Configuración.";
    if (res.status === 429) detalle = "Límite de uso alcanzado en este modelo. Espera un poco o elige otro modelo en Configuración.";
    return NextResponse.json({ error: `Error del proveedor: ${detalle}` }, { status: 502 });
  }

  let completion: { choices?: { message?: { content?: string } }[] };
  try {
    completion = await res.json();
  } catch {
    return NextResponse.json({ error: "Respuesta inválida del proveedor." }, { status: 502 });
  }

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json({ error: "El modelo no devolvió contenido." }, { status: 502 });
  }
  return NextResponse.json({ respuesta: content });
}

export async function POST(request: Request) {
  let mensajes: MensajeChat[];
  let productos: Producto[];
  let pedidos: Pedido[];
  let proveedor: Proveedor = "anthropic";
  let modelo = "claude-opus-4-8";
  let apiKey: string | undefined;
  let baseUrl: string | undefined;

  try {
    const body = await request.json();
    if (!Array.isArray(body.mensajes) || !Array.isArray(body.productos)) throw new Error();
    mensajes = (body.mensajes as MensajeChat[]).slice(-20);
    productos = body.productos as Producto[];
    pedidos = (body.pedidos as Pedido[]) ?? [];
    if (body.proveedor) proveedor = body.proveedor;
    if (body.modelo) modelo = body.modelo;
    if (body.apiKey) apiKey = body.apiKey;
    if (body.baseUrl) baseUrl = body.baseUrl;
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la petición inválido." },
      { status: 400 }
    );
  }

  const systemPrompt = construirSystemPrompt(productos, pedidos);

  if (proveedor === "ollama") {
    const base = (baseUrl ?? "http://localhost:11434").replace(/\/+$/, "") + "/v1";
    return usarOAICompat(mensajes, systemPrompt, modelo, base);
  }

  if (proveedor === "openrouter") {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Necesitas una clave API de OpenRouter. Configúrala en Configuración → Modelo de IA." },
        { status: 503 }
      );
    }
    return usarOAICompat(mensajes, systemPrompt, modelo, "https://openrouter.ai/api/v1", apiKey, {
      "HTTP-Referer": "https://stockscan.app",
      "X-Title": "StockScan",
    });
  }

  return usarAnthropic(mensajes, systemPrompt, modelo, apiKey);
}
