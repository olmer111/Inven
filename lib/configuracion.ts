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
  { id: "meta-llama/llama-3.2-11b-vision-instruct:free", nombre: "Llama 3.2 Vision 11B (gratis)" },
  { id: "qwen/qwen2-vl-7b-instruct:free", nombre: "Qwen 2 VL 7B (gratis)" },
  { id: "anthropic/claude-opus-4", nombre: "Claude Opus 4 (pago)" },
  { id: "openai/gpt-4o-mini", nombre: "GPT-4o Mini (pago)" },
] as const;

const CLAVE_LOCAL = "stockscan_ia_v2";

export const CONFIG_DEFAULTS: ConfigIA = {
  proveedor: "anthropic",
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
