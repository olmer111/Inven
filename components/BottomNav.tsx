"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Package, ClipboardText, GearSix } from "@phosphor-icons/react";

type PestanaDash = "inventario" | "pedidos";

interface BottomNavProps {
  pestana?: PestanaDash;
  onCambiar?: (p: PestanaDash) => void;
}

const TABS_DASH = [
  { id: "inventario" as const, Icono: Package, etiqueta: "Inventario" },
  { id: "pedidos" as const, Icono: ClipboardText, etiqueta: "Pedidos" },
];

export default function BottomNav({ pestana, onCambiar }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const enConfig = pathname === "/configuracion";

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-around px-2">
        {TABS_DASH.map(({ id, Icono, etiqueta }) => {
          const activo = !enConfig && pestana === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (enConfig) router.push("/dashboard");
                onCambiar?.(id);
              }}
              className={`relative flex flex-col items-center gap-0.5 rounded-2xl px-6 py-2 text-xs font-medium transition-colors ${
                activo
                  ? "text-emerald-600"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {activo && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className="absolute inset-0 rounded-2xl bg-emerald-600/10"
                />
              )}
              <Icono
                size={22}
                weight={activo ? "fill" : "regular"}
                className="relative"
              />
              <span className="relative">{etiqueta}</span>
            </button>
          );
        })}

        <Link
          href="/configuracion"
          className={`relative flex flex-col items-center gap-0.5 rounded-2xl px-6 py-2 text-xs font-medium transition-colors ${
            enConfig
              ? "text-emerald-600"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          {enConfig && (
            <motion.span
              layoutId="bottom-nav-pill"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="absolute inset-0 rounded-2xl bg-emerald-600/10"
            />
          )}
          <GearSix
            size={22}
            weight={enConfig ? "fill" : "regular"}
            className="relative"
          />
          <span className="relative">Ajustes</span>
        </Link>
      </div>
    </nav>
  );
}
