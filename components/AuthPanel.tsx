"use client";

import Link from "next/link";
import { Barcode, Camera, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import ThemeToggle from "./ThemeToggle";

const FEATURES = [
  {
    Icono: Camera,
    texto: "Escanea con la cámara, la IA identifica el producto",
  },
  {
    Icono: Sparkle,
    texto: "Inventario actualizado en tiempo real, sin papel",
  },
  {
    Icono: MagnifyingGlass,
    texto: "Sabe al instante si tienes lo que pide tu cliente",
  },
];

export default function AuthPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh]">
      {/* Panel izquierdo — visible solo lg+ */}
      <div className="hidden lg:flex lg:w-[44%] shrink-0 flex-col justify-between bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 p-10 text-white">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Barcode size={22} weight="bold" />
          StockScan
        </Link>

        <div className="space-y-10">
          <div>
            <h2 className="text-[2.6rem] font-extrabold tracking-tighter leading-[1.1]">
              Tu despensa,
              <br />
              escaneada
              <br />
              en segundos.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-emerald-100 max-w-[30ch]">
              Gestiona tu inventario con la cámara del móvil. Sin instalaciones,
              sin papel.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map(({ Icono, texto }) => (
              <li key={texto} className="flex items-start gap-3 text-emerald-50">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Icono size={15} weight="duotone" />
                </span>
                <span className="text-sm leading-snug">{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-emerald-200/60">© 2026 StockScan</p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="relative flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          {/* Logo móvil */}
          <Link
            href="/"
            className="mb-8 flex items-center gap-2 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 lg:hidden"
          >
            <Barcode size={22} weight="bold" className="text-emerald-600" />
            StockScan
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
}
