"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, MagnifyingGlass, CircleNotch } from "@phosphor-icons/react";
import Scanner from "./Scanner";
import {
  buscarProductoPorCodigo,
  type ProductoEscaneado,
} from "@/lib/productos";

interface ModalAgregarProductoProps {
  abierto: boolean;
  onCerrar: () => void;
  onAgregar: (producto: ProductoEscaneado, cantidad: number) => Promise<void>;
}

type Paso = "escanear" | "confirmar";

export default function ModalAgregarProducto({
  abierto,
  onCerrar,
  onAgregar,
}: ModalAgregarProductoProps) {
  const [paso, setPaso] = useState<Paso>("escanear");
  const [codigoManual, setCodigoManual] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [producto, setProducto] = useState<ProductoEscaneado | null>(null);
  const [cantidad, setCantidad] = useState(1);

  const reiniciar = () => {
    setPaso("escanear");
    setCodigoManual("");
    setBuscando(false);
    setGuardando(false);
    setError(null);
    setProducto(null);
    setCantidad(1);
  };

  const cerrar = () => {
    reiniciar();
    onCerrar();
  };

  const procesarCodigo = async (codigo: string) => {
    if (buscando) return;
    setBuscando(true);
    setError(null);
    const encontrado = await buscarProductoPorCodigo(codigo);
    setProducto(
      encontrado ?? {
        codigo,
        nombre: "",
        categoria: null,
        imagen_url: null,
      }
    );
    setBuscando(false);
    setPaso("confirmar");
  };

  const guardar = async () => {
    if (!producto || !producto.nombre.trim()) {
      setError("El producto necesita un nombre.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await onAgregar({ ...producto, nombre: producto.nombre.trim() }, cantidad);
      cerrar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el producto.");
      setGuardando(false);
    }
  };

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 p-0 sm:items-center sm:p-6"
          onClick={cerrar}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Agregar producto"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: 24,
              scale: 0.98,
              transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
                {paso === "escanear" ? "Escanear producto" : "Confirmar producto"}
              </h2>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X size={18} />
              </button>
            </div>

            {paso === "escanear" && (
              <div className="space-y-4">
                <Scanner activo={abierto && paso === "escanear"} onScan={procesarCodigo} />

                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <div className="h-px flex-1 bg-zinc-200" />
                  o escribe el código
                  <div className="h-px flex-1 bg-zinc-200" />
                </div>

                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (codigoManual.trim()) procesarCodigo(codigoManual.trim());
                  }}
                >
                  <label htmlFor="codigo-manual" className="sr-only">
                    Código de barras
                  </label>
                  <input
                    id="codigo-manual"
                    type="text"
                    inputMode="numeric"
                    value={codigoManual}
                    onChange={(e) => setCodigoManual(e.target.value)}
                    placeholder="8480000123456"
                    className="h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                  <button
                    type="submit"
                    disabled={buscando || !codigoManual.trim()}
                    className="flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition duration-150 ease-out hover:bg-zinc-700 disabled:opacity-40 active:scale-[0.98]"
                  >
                    {buscando ? (
                      <CircleNotch size={16} className="animate-spin" />
                    ) : (
                      <MagnifyingGlass size={16} />
                    )}
                    Buscar
                  </button>
                </form>
                {buscando && (
                  <p className="text-center text-sm text-zinc-500">
                    Buscando en Open Food Facts…
                  </p>
                )}
              </div>
            )}

            {paso === "confirmar" && producto && (
              <div className="space-y-4">
                {producto.imagen_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={producto.imagen_url}
                    alt={producto.nombre || "Producto escaneado"}
                    className="mx-auto h-28 w-28 rounded-lg bg-zinc-100 object-contain"
                  />
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="nombre-producto"
                    className="text-sm font-medium text-zinc-700"
                  >
                    Nombre
                  </label>
                  <input
                    id="nombre-producto"
                    type="text"
                    value={producto.nombre}
                    onChange={(e) =>
                      setProducto({ ...producto, nombre: e.target.value })
                    }
                    placeholder="Nombre del producto"
                    className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                  {!producto.nombre && (
                    <p className="text-xs text-zinc-500">
                      No encontramos este código en Open Food Facts; ponle un nombre.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                  <span className="font-mono text-sm text-zinc-600">
                    {producto.codigo}
                  </span>
                  {producto.categoria && (
                    <span className="truncate pl-3 text-xs capitalize text-zinc-500">
                      {producto.categoria}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="cantidad-producto"
                    className="text-sm font-medium text-zinc-700"
                  >
                    Cantidad
                  </label>
                  <input
                    id="cantidad-producto"
                    type="number"
                    min={1}
                    value={cantidad}
                    onChange={(e) =>
                      setCantidad(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 font-mono text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-sm text-red-600">
                    {error}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProducto(null);
                      setPaso("escanear");
                    }}
                    className="h-11 flex-1 rounded-full border border-zinc-300 text-sm font-medium text-zinc-700 transition duration-150 ease-out hover:bg-zinc-50 active:scale-[0.98]"
                  >
                    Volver a escanear
                  </button>
                  <button
                    type="button"
                    onClick={guardar}
                    disabled={guardando}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-medium text-white transition duration-150 ease-out hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {guardando && (
                      <CircleNotch size={16} className="animate-spin" />
                    )}
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
