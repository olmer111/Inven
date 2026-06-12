"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Sun, MoonStars } from "@phosphor-icons/react";

export default function ThemeToggle() {
  // null hasta la primera interacción; el icono visible lo decide el CSS
  // (clases dark:), así el render del servidor y del cliente coinciden.
  const [oscuro, setOscuro] = useState<boolean | null>(null);

  const alternar = () => {
    const siguiente = !document.documentElement.classList.contains("dark");
    setOscuro(siguiente);
    document.documentElement.classList.toggle("dark", siguiente);
    try {
      localStorage.setItem("tema", siguiente ? "oscuro" : "claro");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Cambiar entre modo claro y oscuro"
      className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition duration-150 ease-out hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      <motion.span
        // El giro acompaña el cambio sol→luna; antes del primer render
        // del cliente (oscuro === null) queda estático para no desincronizar.
        animate={oscuro === null ? false : { rotate: oscuro ? 180 : 0 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="flex"
      >
        <Sun size={18} weight="duotone" className="dark:hidden" />
        <MoonStars size={18} weight="duotone" className="hidden dark:block" />
      </motion.span>
    </button>
  );
}
