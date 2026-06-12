import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

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

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "El reconocimiento por IA no está configurado. Añade ANTHROPIC_API_KEY a .env.local.",
      },
      { status: 503 }
    );
  }

  let imagen: string;
  try {
    const body = await request.json();
    imagen = body.imagen;
    if (typeof imagen !== "string" || !imagen.startsWith("data:image/")) {
      throw new Error();
    }
  } catch {
    return NextResponse.json(
      { error: "Envía la imagen como data URL en el campo «imagen»." },
      { status: 400 }
    );
  }

  const [cabecera, datos] = imagen.split(",", 2);
  const mediaType = (cabecera.match(/^data:(image\/(?:jpeg|png|webp|gif))/)?.[1] ??
    "image/jpeg") as MediaType;

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: datos },
            },
            {
              type: "text",
              text: "Identifica el producto de la foto para el inventario de una tienda. Si no hay un producto claro, marca reconocido=false y deja los demás campos con tu mejor aproximación.",
            },
          ],
        },
      ],
      output_config: {
        format: zodOutputFormat(ReconocimientoSchema),
      },
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
        { error: `Error del servicio de IA (${e.status}). Inténtalo de nuevo.` },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "Error inesperado al reconocer el producto." },
      { status: 500 }
    );
  }
}
