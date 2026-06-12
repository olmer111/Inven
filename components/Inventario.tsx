"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  MagnifyingGlass,
  Plus,
  DownloadSimple,
  Barcode,
} from "@phosphor-icons/react";
import ProductoCard from "./ProductoCard";
import ModalAgregarProducto from "./ModalAgregarProducto";
import {
  filtrarProductos,
  limiteDelPlan,
  puedeExportarCSV,
  exportarCSV,
  type ProductoEscaneado,
} from "@/lib/productos";
import { PLANES, type Plan, type Producto } from "@/lib/supabase";

interface InventarioProps {
  productos: Producto[];
  plan: Plan;
  cargando?: boolean;
  onAgregar: (producto: ProductoEscaneado, cantidad: number) => Promise<void>;
  onCambiarCantidad: (id: string, cantidad: number) => void;
  onEliminar: (id: string) => void;
}

export default function Inventario({
  productos,
  plan,
  cargando = false,
  onAgregar,
  onCambiarCantidad,
  onEliminar,
}: InventarioProps) {
  const [consulta, setConsulta] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);

  const filtrados = useMemo(
    () => filtrarProductos(productos, consulta),
    [productos, consulta]
  );

  const limite = limiteDelPlan(plan);
  const enLimite = limite !== null && productos.length >= limite;
  const progreso =
    limite === null ? null : Math.min(100, (productos.length / limite) * 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <label htmlFor="buscador" className="sr-only">
            Buscar por nombre, categoría o código
          </label>
          <input
            id="buscador"
            type="search"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Buscar por nombre, categoría o código"
            className="h-11 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          />
        </div>

        <div className="flex gap-2">
          {puedeExportarCSV(plan) && (
            <button
              type="button"
              onClick={() => exportarCSV(productos)}
              disabled={productos.length === 0}
              className="flex h-11 items-center gap-2 rounded-full border border-zinc-300 dark:border-zinc-700 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition duration-150 ease-out hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 active:scale-[0.98]"
            >
              <DownloadSimple size={16} />
              CSV
            </button>
          )}
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            disabled={enLimite}
            className="flex h-11 items-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-medium text-white transition duration-150 ease-out hover:bg-emerald-700 disabled:opacity-40 active:scale-[0.98]"
          >
            <Plus size={16} weight="bold" />
            Escanear
          </button>
        </div>
      </div>

      {limite !== null && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Plan {PLANES[plan].nombre}
            </span>
            <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-50">
              {productos.length} / {limite}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            {/* scaleX en lugar de width: anima solo transform (GPU). */}
            <motion.div
              initial={false}
              animate={{ transform: `scaleX(${(progreso ?? 0) / 100})` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              style={{ transformOrigin: "left" }}
              className={`h-full w-full rounded-full ${
                enLimite ? "bg-red-500" : "bg-emerald-600"
              }`}
            />
          </div>
          {enLimite && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              Has alcanzado el límite de tu plan. Pasa a un plan superior para
              seguir añadiendo productos.
            </p>
          )}
        </div>
      )}

      {cargando ? (
        <div className="space-y-3" aria-label="Cargando inventario">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
            >
              <div className="h-14 w-14 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/5 rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-3 w-1/4 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-16 text-center">
          <Barcode size={36} weight="duotone" className="text-zinc-300" />
          {productos.length === 0 ? (
            <>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                Tu inventario está vacío
              </p>
              <p className="max-w-[40ch] text-sm text-zinc-500">
                Pulsa «Escanear» y apunta la cámara al código de barras de
                cualquier producto para empezar.
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              Ningún producto coincide con «{consulta}».
            </p>
          )}
        </div>
      ) : (
        <motion.ul layout className="space-y-3">
          {filtrados.map((p) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductoCard
                producto={p}
                onCambiarCantidad={onCambiarCantidad}
                onEliminar={onEliminar}
              />
            </motion.li>
          ))}
        </motion.ul>
      )}

      <ModalAgregarProducto
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onAgregar={onAgregar}
      />
    </div>
  );
}
