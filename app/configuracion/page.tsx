"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Barcode,
  Check,
  CircleNotch,
  Plugs,
  SignOut,
} from "@phosphor-icons/react";
import ThemeToggle from "@/components/ThemeToggle";
import BottomNav from "@/components/BottomNav";
import BurbujaAsistente from "@/components/BurbujaAsistente";
import { supabase, isSupabaseConfigured, PLANES, type Plan } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  obtenerConfigIA,
  guardarConfigIA,
  conectarOpenRouter,
  canjearCodigoOpenRouter,
  listarModelosVisionOpenRouter,
  MODELOS_ANTHROPIC,
  MODELOS_OLLAMA_VISION,
  MODELOS_OPENROUTER,
  type ConfigIA,
  type ModeloOpenRouter,
  type Proveedor,
} from "@/lib/configuracion";

const PESTANAS: {
  clave: Proveedor;
  etiqueta: string;
  descripcion: string;
}[] = [
  {
    clave: "anthropic",
    etiqueta: "Anthropic",
    descripcion:
      "Modelos Claude directamente. Usa tu clave API o la del servidor.",
  },
  {
    clave: "ollama",
    etiqueta: "Ollama",
    descripcion:
      "Modelos locales y gratuitos ejecutados en tu propio ordenador.",
  },
  {
    clave: "openrouter",
    etiqueta: "OpenRouter",
    descripcion:
      "Accede a decenas de modelos con una sola clave. Algunos son gratuitos.",
  },
];

export default function ConfiguracionPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<User | null>(null);
  const [plan, setPlan] = useState<Plan>("gratuito");
  const [cargando, setCargando] = useState(true);
  const [config, setConfig] = useState<ConfigIA | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [conectandoOR, setConectandoOR] = useState(false);
  const [errorOR, setErrorOR] = useState<string | null>(null);
  const [modelosOR, setModelosOR] = useState<ModeloOpenRouter[] | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      router.replace("/auth/login");
      return;
    }
    let activo = true;
    const cargar = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!activo) return;
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      setUsuario(user);
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("plan")
        .eq("id", user.id)
        .single();
      if (activo && perfil?.plan) setPlan(perfil.plan as Plan);
      setConfig(obtenerConfigIA());
      setCargando(false);
    };
    cargar();
    return () => {
      activo = false;
    };
  }, [router]);

  // Vuelta de la autorización de OpenRouter: ?code= se canjea por la clave.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return;
    window.history.replaceState(null, "", "/configuracion");
    queueMicrotask(() => setConectandoOR(true));
    canjearCodigoOpenRouter(code)
      .then((key) => {
        setConfig(() => {
          const base = obtenerConfigIA();
          const nuevo: ConfigIA = {
            ...base,
            proveedor: "openrouter",
            openrouter: { ...base.openrouter, apiKey: key },
          };
          guardarConfigIA(nuevo);
          return nuevo;
        });
      })
      .catch((e) =>
        setErrorOR(
          e instanceof Error ? e.message : "No se pudo conectar con OpenRouter."
        )
      )
      .finally(() => setConectandoOR(false));
  }, []);

  // Lista en vivo de modelos con visión al abrir la pestaña OpenRouter.
  useEffect(() => {
    if (config?.proveedor !== "openrouter" || modelosOR) return;
    listarModelosVisionOpenRouter()
      .then(setModelosOR)
      .catch(() => {});
  }, [config?.proveedor, modelosOR]);

  const salir = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const guardar = () => {
    if (!config) return;
    guardarConfigIA(config);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  const setProveedor = (proveedor: Proveedor) =>
    setConfig((c) => c && { ...c, proveedor });

  const setAnthropic = (patch: Partial<ConfigIA["anthropic"]>) =>
    setConfig((c) => c && { ...c, anthropic: { ...c.anthropic, ...patch } });

  const setOllama = (patch: Partial<ConfigIA["ollama"]>) =>
    setConfig((c) => c && { ...c, ollama: { ...c.ollama, ...patch } });

  const setOpenRouter = (patch: Partial<ConfigIA["openrouter"]>) =>
    setConfig((c) => c && { ...c, openrouter: { ...c.openrouter, ...patch } });

  if (cargando || !config) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600" />
      </div>
    );
  }

  const planInfo = PLANES[plan];

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 dark:border-zinc-800/70 bg-background/85 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            <Barcode size={22} weight="bold" className="text-emerald-600" />
            StockScan
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 pb-28 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Configuración
        </h1>

        {/* Cuenta */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-5">
            Cuenta
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 font-semibold text-emerald-700 dark:text-emerald-400">
              {usuario?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {usuario?.email}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-600/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {planInfo.nombre}
                </span>
                <span className="text-xs text-zinc-500">
                  {planInfo.limite === null
                    ? "Ilimitado"
                    : `${planInfo.limite} productos`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={salir}
              className="shrink-0 flex items-center gap-2 rounded-full border border-zinc-300 dark:border-zinc-700 px-3.5 py-2 text-sm text-zinc-700 dark:text-zinc-300 transition duration-150 ease-out hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98]"
            >
              <SignOut size={15} />
              Salir
            </button>
          </div>
        </section>

        {/* Modelo de IA */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Modelo de IA
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Elige el proveedor que usará StockScan para reconocer productos con
            la cámara.
          </p>

          {/* Tabs */}
          <div className="mt-5 flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-1 gap-1">
            {PESTANAS.map(({ clave, etiqueta }) => (
              <button
                key={clave}
                type="button"
                onClick={() => setProveedor(clave)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  config.proveedor === clave
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            {PESTANAS.find((p) => p.clave === config.proveedor)?.descripcion}
          </p>

          <div className="mt-5 space-y-4">
            {/* ── Anthropic ── */}
            {config.proveedor === "anthropic" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Clave API
                  </label>
                  <input
                    type="password"
                    value={config.anthropic.apiKey}
                    onChange={(e) => setAnthropic({ apiKey: e.target.value })}
                    placeholder="sk-ant-..."
                    autoComplete="off"
                    className="h-11 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                  <p className="text-xs text-zinc-500">
                    Déjala vacía para usar la clave del servidor (si está
                    configurada con{" "}
                    <code className="font-mono">ANTHROPIC_API_KEY</code>).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Modelo
                  </label>
                  <select
                    value={config.anthropic.modelo}
                    onChange={(e) => setAnthropic({ modelo: e.target.value })}
                    className="h-11 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-50 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  >
                    {MODELOS_ANTHROPIC.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* ── Ollama ── */}
            {config.proveedor === "ollama" && (
              <>
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Ollama debe estar en ejecución y el modelo debe soportar
                    imágenes (visión). En producción, usa una URL pública en
                    lugar de <code className="font-mono">localhost</code>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    URL del servidor
                  </label>
                  <input
                    type="text"
                    value={config.ollama.baseUrl}
                    onChange={(e) => setOllama({ baseUrl: e.target.value })}
                    placeholder="http://localhost:11434"
                    className="h-11 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={config.ollama.modelo}
                    onChange={(e) => setOllama({ modelo: e.target.value })}
                    placeholder="llava"
                    className="h-11 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-500">
                    Modelos de visión populares:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {MODELOS_OLLAMA_VISION.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setOllama({ modelo: m })}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          config.ollama.modelo === m
                            ? "border-emerald-600 bg-emerald-600/5 text-emerald-700 dark:text-emerald-400"
                            : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── OpenRouter ── */}
            {config.proveedor === "openrouter" && (
              <>
                {config.openrouter.apiKey ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-600/30 bg-emerald-600/5 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      <Check size={15} weight="bold" />
                      Conectado a OpenRouter
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenRouter({ apiKey: "" })}
                      className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                      Desconectar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      disabled={conectandoOR}
                      onClick={() =>
                        conectarOpenRouter(
                          `${window.location.origin}/configuracion`
                        )
                      }
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-sm font-medium text-white dark:text-zinc-900 transition duration-150 ease-out hover:bg-zinc-700 dark:hover:bg-white disabled:opacity-50 active:scale-[0.98]"
                    >
                      {conectandoOR ? (
                        <CircleNotch size={16} className="animate-spin" />
                      ) : (
                        <Plugs size={16} weight="bold" />
                      )}
                      {conectandoOR
                        ? "Conectando..."
                        : "Conectar con OpenRouter"}
                    </button>
                    <p className="text-center text-xs text-zinc-500">
                      Inicia sesión en OpenRouter y la clave se configura sola.
                      Varios modelos son gratuitos.
                    </p>
                    <details className="text-xs text-zinc-500">
                      <summary className="cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
                        O pega una clave manualmente
                      </summary>
                      <input
                        type="password"
                        value={config.openrouter.apiKey}
                        onChange={(e) =>
                          setOpenRouter({ apiKey: e.target.value })
                        }
                        placeholder="sk-or-..."
                        autoComplete="off"
                        className="mt-2 h-11 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      />
                    </details>
                  </div>
                )}

                {errorOR && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {errorOR}
                  </p>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Modelo
                  </label>
                  {modelosOR ? (
                    <select
                      value={config.openrouter.modelo}
                      onChange={(e) =>
                        setOpenRouter({ modelo: e.target.value })
                      }
                      className="h-11 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-50 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    >
                      {!modelosOR.some(
                        (m) => m.id === config.openrouter.modelo
                      ) && (
                        <option value={config.openrouter.modelo}>
                          {config.openrouter.modelo}
                        </option>
                      )}
                      <optgroup label="Gratuitos">
                        {modelosOR
                          .filter((m) => m.gratis)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nombre}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="De pago">
                        {modelosOR
                          .filter((m) => !m.gratis)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nombre}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={config.openrouter.modelo}
                        onChange={(e) =>
                          setOpenRouter({ modelo: e.target.value })
                        }
                        placeholder="google/gemini-2.0-flash-exp:free"
                        className="h-11 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      />
                      <div className="flex flex-wrap gap-2 pt-1">
                        {MODELOS_OPENROUTER.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setOpenRouter({ modelo: m.id })}
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                              config.openrouter.modelo === m.id
                                ? "border-emerald-600 bg-emerald-600/5 text-emerald-700 dark:text-emerald-400"
                                : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500"
                            }`}
                          >
                            {m.nombre}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <p className="text-xs text-zinc-500">
                    Solo se muestran modelos que entienden imágenes. Los
                    gratuitos pueden tener límites de uso por día.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={guardar}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition duration-150 ease-out active:scale-[0.98] ${
                guardado
                  ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {guardado ? (
                <>
                  <Check size={15} weight="bold" />
                  Configuración guardada
                </>
              ) : (
                "Guardar configuración"
              )}
            </button>
          </div>
        </section>
      </main>

      <BottomNav />
      <BurbujaAsistente usuario={usuario} />
    </div>
  );
}
