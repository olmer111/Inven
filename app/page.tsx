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
} from "@phosphor-icons/react";
import { PLANES, type Plan } from "@/lib/supabase";
import { PRODUCTOS_DEMO } from "@/lib/demo-data";

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
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: retraso, ease: facil }}
    >
      {children}
    </motion.div>
  );
}

function VistaPreviaInventario() {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-[0_24px_64px_-24px_rgba(24,24,27,0.22)]">
      <div className="mb-3 flex items-baseline justify-between text-xs">
        <span className="text-zinc-500">Plan Gratuito</span>
        <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-50">5 / 30</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className="h-full w-[17%] rounded-full bg-emerald-600" />
      </div>
      <ul className="space-y-2">
        {PRODUCTOS_DEMO.slice(0, 4).map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 px-3 py-2.5"
          >
            <Barcode size={18} weight="duotone" className="shrink-0 text-zinc-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-50">
                {p.nombre}
              </p>
              <p className="font-mono text-[11px] text-zinc-400">{p.codigo}</p>
            </div>
            <span className="font-mono text-[13px] tabular-nums text-zinc-600 dark:text-zinc-400">
              ×{p.cantidad}
            </span>
          </li>
        ))}
      </ul>
    </div>
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
            className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
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
              className="rounded-full bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* ── Hero: split, alineado a la izquierda ── */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-2 lg:gap-16 lg:pt-24">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: facil }}
          >
            <h1 className="max-w-[14ch] text-4xl font-semibold tracking-tighter text-zinc-900 dark:text-zinc-50 md:text-5xl lg:text-6xl">
              Tu despensa, escaneada en segundos.
            </h1>
            <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg">
              Apunta la cámara al código de barras y StockScan identifica el
              producto y lo guarda en tu inventario.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/auth/register"
                className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition duration-150 ease-out hover:bg-emerald-700 active:scale-[0.98]"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/demo"
                className="rounded-full border border-zinc-300 dark:border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition duration-150 ease-out hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98]"
              >
                Ver la demo
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: facil }}
            className="relative"
          >
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 rounded-3xl bg-emerald-600/[0.06]"
            />
            <VistaPreviaInventario />
          </motion.div>
        </section>

        {/* ── Cómo funciona: 3 pasos ── */}
        <section className="border-y border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Revela>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
                Tres pasos, cero teclado
              </h2>
            </Revela>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-800 md:grid-cols-3">
              {[
                {
                  icono: Camera,
                  titulo: "Escanea",
                  texto:
                    "Abre la cámara desde el móvil y apunta al código de barras o QR.",
                },
                {
                  icono: MagnifyingGlass,
                  titulo: "Identifica",
                  texto:
                    "Buscamos el nombre, la imagen y la categoría en Open Food Facts.",
                },
                {
                  icono: ChartBar,
                  titulo: "Controla",
                  texto:
                    "Ajusta cantidades, busca al instante y vigila el límite de tu plan.",
                },
              ].map((paso, i) => (
                <Revela key={paso.titulo} retraso={i * 0.08}>
                  <div className="flex h-full flex-col gap-3 bg-white dark:bg-zinc-900 p-7">
                    <paso.icono
                      size={26}
                      weight="duotone"
                      className="text-emerald-600"
                    />
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                      <span className="mr-2 font-mono text-sm text-zinc-400">
                        0{i + 1}
                      </span>
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

        {/* ── Capacidades: grid asimétrico con variedad de fondos ── */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Revela>
            <h2 className="max-w-[24ch] text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
              Pensado para inventarios reales, no para hojas de cálculo
            </h2>
          </Revela>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Revela className="md:col-span-2">
              <div className="flex h-full flex-col justify-between gap-8 rounded-2xl bg-zinc-900 p-7 text-white dark:border dark:border-zinc-800">
                <Barcode size={28} weight="duotone" className="text-emerald-400" />
                <div>
                  <h3 className="font-medium">Escaneo desde el navegador</h3>
                  <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-zinc-400">
                    Códigos de barras EAN y códigos QR con la cámara del móvil.
                    Sin instalar nada: funciona como web app.
                  </p>
                </div>
              </div>
            </Revela>
            <Revela retraso={0.08}>
              <div className="flex h-full flex-col justify-between gap-8 rounded-2xl bg-emerald-600/10 p-7">
                <DownloadSimple size={28} weight="duotone" className="text-emerald-700 dark:text-emerald-400" />
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Exporta a CSV</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Llévate tu inventario a Excel o Sheets con un clic, en los
                    planes Pro y Max.
                  </p>
                </div>
              </div>
            </Revela>
            <Revela>
              <div className="flex h-full flex-col justify-between gap-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7">
                <UsersThree size={28} weight="duotone" className="text-emerald-600" />
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Multi-usuario</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Comparte el inventario con tu equipo o tu familia en el plan
                    Max.
                  </p>
                </div>
              </div>
            </Revela>
            <Revela retraso={0.08} className="md:col-span-2">
              <div className="flex h-full flex-col justify-between gap-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7">
                <MagnifyingGlass size={28} weight="duotone" className="text-emerald-600" />
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
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
        <section id="precios" className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Revela>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
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
                  <Revela key={clave} retraso={i * 0.08}>
                    <div
                      className={`relative flex h-full flex-col rounded-2xl p-7 ${
                        destacado
                          ? "bg-zinc-900 text-white dark:border dark:border-zinc-700"
                          : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      {destacado && (
                        <span className="absolute -top-3 left-7 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">
                          Más elegido
                        </span>
                      )}
                      <h3
                        className={`font-medium ${
                          destacado ? "text-white" : "text-zinc-900 dark:text-zinc-50"
                        }`}
                      >
                        {plan.nombre}
                      </h3>
                      <p className="mt-3 flex items-baseline gap-1.5">
                        <span
                          className={`text-4xl font-semibold tracking-tight ${
                            destacado ? "text-white" : "text-zinc-900 dark:text-zinc-50"
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
                      <ul className="mt-6 flex-1 space-y-2.5">
                        {plan.rasgos.map((rasgo) => (
                          <li
                            key={rasgo}
                            className={`flex items-start gap-2.5 text-sm ${
                              destacado ? "text-zinc-300" : "text-zinc-600 dark:text-zinc-400"
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
                        className={`mt-8 rounded-full py-2.5 text-center text-sm font-medium transition duration-150 ease-out active:scale-[0.98] ${
                          destacado
                            ? "bg-emerald-600 text-white hover:bg-emerald-500"
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
          <p className="flex items-center gap-2">
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
