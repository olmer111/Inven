export type Proveedor = "anthropic" | "ollama" | "openrouter";

export interface ConfigIA {
  proveedor: Proveedor;
  anthropic: { modelo: string; apiKey: string };
  ollama: { modelo: string; baseUrl: string };
  openrouter: { modelo: string; apiKey: string };
}

export const MODELOS_ANTHROPIC = [
  { id: "claude-opus-4-8", nombre: "Claude Opus 4.8 (más capaz)" },
  { id: "claude-sonnet-4-6", nombre: "Claude Sonnet 4.6" },
  { id: "claude-haiku-4-5-20251001", nombre: "Claude Haiku 4.5 (más rápido)" },
] as const;

export const MODELOS_OLLAMA_VISION = [
  "llava",
  "llava:13b",
  "moondream",
  "llama3.2-vision",
  "bakllava",
] as const;

export const MODELOS_OPENROUTER = [
  { id: "google/gemini-2.0-flash-exp:free", nombre: "Gemini 2.0 Flash (gratis)" },
  { id: "qwen/qwen-2.5-vl-7b-instruct:free", nombre: "Qwen 2.5 VL 7B (gratis)" },
  { id: "google/gemma-3-12b-it:free", nombre: "Gemma 3 12B (gratis)" },
  { id: "anthropic/claude-opus-4", nombre: "Claude Opus 4 (pago)" },
  { id: "openai/gpt-4o-mini", nombre: "GPT-4o Mini (pago)" },
] as const;

const CLAVE_LOCAL = "stockscan_ia_v2";

export const CONFIG_DEFAULTS: ConfigIA = {
  proveedor: "openrouter",
  anthropic: { modelo: "claude-opus-4-8", apiKey: "" },
  ollama: { modelo: "llava", baseUrl: "http://localhost:11434" },
  openrouter: { modelo: "google/gemini-2.0-flash-exp:free", apiKey: "" },
};

export function obtenerConfigIA(): ConfigIA {
  if (typeof window === "undefined") return CONFIG_DEFAULTS;
  try {
    const raw = localStorage.getItem(CLAVE_LOCAL);
    if (!raw) return CONFIG_DEFAULTS;
    const p = JSON.parse(raw);
    return {
      proveedor: p.proveedor ?? CONFIG_DEFAULTS.proveedor,
      anthropic: { ...CONFIG_DEFAULTS.anthropic, ...p.anthropic },
      ollama: { ...CONFIG_DEFAULTS.ollama, ...p.ollama },
      openrouter: { ...CONFIG_DEFAULTS.openrouter, ...p.openrouter },
    };
  } catch {
    return CONFIG_DEFAULTS;
  }
}

export function guardarConfigIA(config: ConfigIA): void {
  try {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(config));
  } catch {}
}

// ── OpenRouter: conexión con un clic (OAuth PKCE) ─────────────────────────
// El usuario autoriza en openrouter.ai y volvemos con un código que se
// canjea por una clave API, sin copiar nada a mano.

const CLAVE_VERIFIER = "stockscan_or_verifier";

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Redirige a OpenRouter para autorizar la app. Al volver, llama a canjearCodigoOpenRouter. */
export async function conectarOpenRouter(callbackUrl: string): Promise<void> {
  const aleatorio = new Uint8Array(32);
  crypto.getRandomValues(aleatorio);
  const verifier = base64url(aleatorio);
  sessionStorage.setItem(CLAVE_VERIFIER, verifier);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  const challenge = base64url(new Uint8Array(digest));
  window.location.href = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(
    callbackUrl
  )}&code_challenge=${challenge}&code_challenge_method=S256`;
}

/** Canjea el ?code= devuelto por OpenRouter por una clave API. */
export async function canjearCodigoOpenRouter(code: string): Promise<string> {
  const verifier = sessionStorage.getItem(CLAVE_VERIFIER);
  const res = await fetch("https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      ...(verifier && { code_verifier: verifier, code_challenge_method: "S256" }),
    }),
  });
  sessionStorage.removeItem(CLAVE_VERIFIER);
  if (!res.ok) {
    throw new Error("OpenRouter no aceptó la autorización. Inténtalo de nuevo.");
  }
  const data = await res.json();
  if (!data.key) throw new Error("OpenRouter no devolvió ninguna clave.");
  return data.key as string;
}

export interface ModeloOpenRouter {
  id: string;
  nombre: string;
  gratis: boolean;
}

/** Modelos de OpenRouter que aceptan imágenes, gratuitos primero. */
export async function listarModelosVisionOpenRouter(): Promise<
  ModeloOpenRouter[]
> {
  const res = await fetch("https://openrouter.ai/api/v1/models");
  if (!res.ok) throw new Error("No se pudo obtener la lista de modelos.");
  const { data } = (await res.json()) as {
    data: {
      id: string;
      name?: string;
      pricing?: { prompt?: string };
      architecture?: { input_modalities?: string[] };
    }[];
  };
  return data
    .filter((m) => m.architecture?.input_modalities?.includes("image"))
    .map((m) => ({
      id: m.id,
      nombre: m.name ?? m.id,
      gratis: Number(m.pricing?.prompt ?? 1) === 0,
    }))
    .sort((a, b) =>
      a.gratis === b.gratis ? a.nombre.localeCompare(b.nombre) : a.gratis ? -1 : 1
    );
}
