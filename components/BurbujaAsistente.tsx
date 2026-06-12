"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChatCircleDots, X } from "@phosphor-icons/react";
import type { User } from "@supabase/supabase-js";
import type { Producto, Pedido } from "@/lib/supabase";
import Asistente from "./Asistente";

interface BurbujaAsistenteProps {
  productos?: Producto[];
  pedidos?: Pedido[];
  usuario: User | null;
}

export default function BurbujaAsistente({ productos, pedidos, usuario }: BurbujaAsistenteProps) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <AnimatePresence>
        {!abierto && (
          <motion.button
            type="button"
            onClick={() => setAbierto(true)}
            aria-label="Abrir asistente"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-5 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-colors"
            style={{ height: 52, width: 52 }}
          >
            <ChatCircleDots size={24} weight="fill" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {abierto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-zinc-950/40"
              onClick={() => setAbierto(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-white dark:bg-zinc-950 shadow-2xl"
              style={{ maxHeight: "85dvh" }}
            >
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 py-4">
                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Asistente</p>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  aria-label="Cerrar asistente"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <Asistente productos={productos} pedidos={pedidos} usuario={usuario} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
