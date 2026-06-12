"use client";

import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  Barcode,
  Camera,
  MagnifyingGlass,
  ChartBar,
  DownloadSimple,
  UsersThree,
  Check,
  Sparkle,
} from "@phosphor-icons/react";
import { PLANES, type Plan } from "@/lib/supabase";

const facil = [0.16, 1, 0.3, 1] as const;

function Revela({
  children,
  retraso = 0,
  className,
}: {
  children: React.ReactNode;
  retraso?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 36, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.65, delay: retraso, ease: facil }}
    >
      {children}
    </motion.div>
  );
}

const MOCKS = [
  { nombre: "Aceite de oliva virgen extra", codigo: "8410660220050", cantidad: 3 },
  { nombre: "Detergente Ariel 3 kg", codigo: "8001841640983", cantidad: 1 },
  { nombre: "Leche entera Hacendado", codigo: "8480000902337", cantidad: 6 },
];

function MockDashboard() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.75, delay: 0.2, ease: facil }}
      className="rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl shadow-zinc-900/10 dark:shadow-black/40 ring-1 ring-zinc-200/80 dark:ring-zinc-800 overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-zinc-100 dark:border-zinc-800 px-5 py-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
        <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Mi inventario
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-400">3 / 30</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* Progress */}
      <div className="px-5 pt-3.5">
        <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 0.1 }}
            style={{ transformOrigin: "left" }}
            transition={{ duration: 1.2, delay: 0.6, ease: facil }}
          />
        </div>
      </div>

      {/* Products */}
      <ul className="p-3 space-y-1.5">
        {MOCKS.map((p, i) => (
          <motion.li
            key={p.codigo}
            initial={reduce ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.45 + i * 0.13, ease: facil }}
            className="flex items-center gap-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-3"
          >
            <Barcode
              size={16}
              weight="duotone"
              className="shrink-0 text-zinc-400"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-50">
                {p.nombre}
              </p>
              <p className="font-mono text-[11px] text-zinc-400">{p.codigo}</p>
            </div>
            <span className="font-mono text-xs tabular-nums text-zinc-500">
              ×{p.cantidad}
            </span>
          </motion.li>
        ))}
      </ul>

      {/* CTA mock */}
      <div className="px-3 pb-3">
        <div className="flex h-10 items-center justify-center gap-2 rounded-full bg-emerald-600/8 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Camera size={14} weight="duotone" />
          Escanear producto
        </div>
      </div>
    </motion.div>
  );
}

export default function Landing() {
  const reduce = useReducedMotion();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 dark:border-zinc-800/70 bg-background/85 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            <Barcode size={22} weight="bold" className="text-emerald-600" />
            StockScan
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link
              href="/demo"
              className="hidden rounded-full px-3.5 py-2 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 sm:block"
            >
              Demo
            </Link>
            <a
              href="#precios"
              className="hidden rounded-full px-3.5 py-2 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 sm:block"
            >
              Precios
            </a>
            <Link
              href="/auth/login"
              className="rounded-full px-3.5 py-2 text-sm text-zinc-600 dark:text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-[0.98]"
            >
              Crear cuenta
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          {/* Blob background */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-emerald-500/[0.07] dark:bg-emerald-500/[0.05] blur-3xl"
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-20 lg:grid-cols-2 lg:gap-20 lg:pt-28">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: facil }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-5">
                <Sparkle size={12} weight="fill" />
                IA reconoce tus productos
              </span>
              <h1 className="max-w-[13ch] text-5xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50 md:text-6xl lg:text-[4.25rem] leading-[1.05]">
                Tu despensa, escaneada en segundos.
              </h1>
              <p className="mt-6 max-w-[42ch] text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg">
                Apunta la cámara al código de barras y StockScan identifica el
                producto y lo guarda en tu inventario. Sin papel, sin teclado.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/register"
                  className="rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition duration-150 ease-out hover:bg-emerald-700 active:scale-[0.98]"
                >
                  Crear cuenta gratis
                </Link>
                <Link
                  href="/demo"
                  className="rounded-full border border-zinc-300 dark:border-zinc-700 px-7 py-3.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition duration-150 ease-out hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98]"
                >
                  Ver la demo →
                </Link>
              </div>
            </motion.div>

            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-br from-emerald-50 to-zinc-100 dark:from-emerald-900/20 dark:to-zinc-800/20"
              />
              <MockDashboard />
            </div>
          </div>
        </section>

        {/* ── Cómo funciona ── */}
        <section className="border-y border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Revela>
              <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
                Tres pasos, cero teclado
              </h2>
            </Revela>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  icono: Camera,
                  titulo: "Escanea",
                  texto:
                    "Abre la cámara desde el móvil y apunta al código de barras o QR.",
                  color: "bg-violet-50 dark:bg-violet-900/20",
                  iconColor: "text-violet-600 dark:text-violet-400",
                },
                {
                  icono: Sparkle,
                  titulo: "Identifica",
                  texto:
                    "La IA reconoce el producto, su categoría y sus especificaciones.",
                  color: "bg-emerald-50 dark:bg-emerald-900/20",
                  iconColor: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  icono: ChartBar,
                  titulo: "Controla",
                  texto:
                    "Ajusta cantidades, busca al instante y vigila el límite de tu plan.",
                  color: "bg-amber-50 dark:bg-amber-900/20",
                  iconColor: "text-amber-600 dark:text-amber-400",
                },
              ].map((paso, i) => (
                <Revela key={paso.titulo} retraso={i * 0.12}>
                  <div className={`flex h-full flex-col gap-4 rounded-3xl p-7 ${paso.color}`}>
                    <div className="flex items-center gap-3">
                      <paso.icono
                        size={22}
                        weight="duotone"
                        className={paso.iconColor}
                      />
                      <span className="font-mono text-sm text-zinc-400">
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                      {paso.titulo}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {paso.texto}
                    </p>
                  </div>
                </Revela>
              ))}
            </div>
          </div>
        </section>

        {/* ── Capacidades ── */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Revela>
            <h2 className="max-w-[24ch] text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
              Pensado para inventarios reales, no para hojas de cálculo
            </h2>
          </Revela>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Revela className="md:col-span-2">
              <div className="flex h-full flex-col justify-between gap-8 rounded-3xl bg-zinc-900 p-7 text-white dark:border dark:border-zinc-800">
                <Barcode size={28} weight="duotone" className="text-emerald-400" />
                <div>
                  <h3 className="font-bold">Escaneo desde el navegador</h3>
                  <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-zinc-400">
                    Códigos de barras EAN y QR con la cámara del móvil. Sin
                    instalar nada: funciona como web app.
                  </p>
                </div>
              </div>
            </Revela>
            <Revela retraso={0.12}>
              <div className="flex h-full flex-col justify-between gap-8 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 p-7">
                <DownloadSimple
                  size={28}
                  weight="duotone"
                  className="text-emerald-700 dark:text-emerald-400"
                />
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                    Exporta a CSV
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Llévate tu inventario a Excel o Sheets con un clic, en los
                    planes Pro y Max.
                  </p>
                </div>
              </div>
            </Revela>
            <Revela>
              <div className="flex h-full flex-col justify-between gap-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7">
                <UsersThree
                  size={28}
                  weight="duotone"
                  className="text-emerald-600"
                />
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                    Multi-usuario
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Comparte el inventario con tu equipo o tu familia en el plan
                    Max.
                  </p>
                </div>
              </div>
            </Revela>
            <Revela retraso={0.12} className="md:col-span-2">
              <div className="flex h-full flex-col justify-between gap-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7">
                <MagnifyingGlass
                  size={28}
                  weight="duotone"
                  className="text-emerald-600"
                />
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                    Tus datos, solo tuyos
                  </h3>
                  <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Autenticación con Supabase y Row Level Security: cada
                    usuario solo puede leer y escribir su propio inventario.
                  </p>
                </div>
              </div>
            </Revela>
          </div>
        </section>

        {/* ── Precios ── */}
        <section
          id="precios"
          className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Revela>
              <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
                Un plan para cada despensa
              </h2>
              <p className="mt-3 max-w-[48ch] text-zinc-600 dark:text-zinc-400">
                Empieza gratis con 30 productos. Cambia de plan cuando tu
                inventario crezca.
              </p>
            </Revela>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {(Object.keys(PLANES) as Plan[]).map((clave, i) => {
                const plan = PLANES[clave];
                const destacado = clave === "pro";
                return (
                  <Revela key={clave} retraso={i * 0.1}>
                    <div
                      className={`relative flex h-full flex-col rounded-3xl p-7 ${
                        destacado
                          ? "bg-zinc-900 text-white dark:border dark:border-zinc-700"
                          : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      {destacado && (
                        <span className="absolute -top-3.5 left-7 rounded-full bg-emerald-600 px-3.5 py-1 text-xs font-bold text-white shadow-lg shadow-emerald-600/30">
                          Más elegido
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-bold ${
                            destacado
                              ? "text-white"
                              : "text-zinc-900 dark:text-zinc-50"
                          }`}
                        >
                          {plan.nombre}
                        </h3>
                        {clave === "gratuito" && (
                          <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500">
                            Gratis
                          </span>
                        )}
                      </div>
                      <p className="mt-3 flex items-baseline gap-1.5">
                        <span
                          className={`text-4xl font-extrabold tracking-tight ${
                            destacado
                              ? "text-white"
                              : "text-zinc-900 dark:text-zinc-50"
                          }`}
                        >
                          {plan.precio}
                        </span>
                        {clave !== "gratuito" && (
                          <span
                            className={
                              destacado ? "text-zinc-400" : "text-zinc-500"
                            }
                          >
                            /mes
                          </span>
                        )}
                      </p>
                      <ul className="mt-6 flex-1 space-y-3">
                        {plan.rasgos.map((rasgo) => (
                          <li
                            key={rasgo}
                            className={`flex items-start gap-2.5 text-sm ${
                              destacado
                                ? "text-zinc-300"
                                : "text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            <Check
                              size={16}
                              weight="bold"
                              className="mt-0.5 shrink-0 text-emerald-500"
                            />
                            {rasgo}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`/auth/register?plan=${clave}`}
                        className={`mt-8 rounded-full py-3 text-center text-sm font-semibold transition duration-150 ease-out active:scale-[0.98] ${
                          destacado
                            ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/25"
                            : "border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        Elegir {plan.nombre}
                      </Link>
                    </div>
                  </Revela>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-zinc-500 sm:flex-row">
          <p className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-300">
            <Barcode size={16} weight="bold" className="text-emerald-600" />
            StockScan
          </p>
          <p>
            Datos de productos por{" "}
            <a
              href="https://world.openfoodfacts.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-zinc-300 dark:decoration-zinc-600 underline-offset-2 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Open Food Facts
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
