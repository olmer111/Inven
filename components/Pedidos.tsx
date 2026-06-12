"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  MagnifyingGlass,
  Camera,
  CircleNotch,
  CheckCircle,
  XCircle,
  NotePencil,
  Trash,
  ClipboardText,
  X,
} from "@phosphor-icons/react";
import CapturaFoto from "./CapturaFoto";
import { filtrarProductos } from "@/lib/productos";
import { reconocerProducto } from "@/lib/reconocer";
import type { Pedido, Producto } from "@/lib/supabase";

interface PedidosProps {
  productos: Producto[];
  pedidos: Pedido[];
  onAgregarPedido: (nombre: string, notas: string | null) => Promise<void>;
  onEliminarPedido: (id: string) => void;
}

interface Resultado {
  termino: string;
  notas: string | null;
  encontrados: Producto[];
}

export default function Pedidos({
  productos,
  pedidos,
  onAgregarPedido,
  onEliminarPedido,
}: PedidosProps) {
  const [consulta, setConsulta] = useState("");
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [apuntando, setApuntando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = (termino: string, notas: string | null = null) => {
    const limpio = termino.trim();
    if (!limpio) return;
    setResultado({
      termino: limpio,
      notas,
      encontrados: filtrarProductos(productos, limpio),
    });
  };

  const buscarPorFoto = async (imagen: string) => {
    setCamaraAbierta(false);
    setAnalizando(true);
    setError(null);
    try {
      const r = await reconocerProducto(imagen);
      setConsulta(r.nombre);
      buscar(r.nombre, r.descripcion || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo analizar la foto.");
    } finally {
      setAnalizando(false);
    }
  };

  const apuntar = async () => {
    if (!resultado) return;
    setApuntando(true);
    setError(null);
    try {
      await onAgregarPedido(resultado.termino, resultado.notas);
      setResultado(null);
      setConsulta("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo apuntar el pedido.");
    } finally {
      setApuntando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── ¿Lo tenemos? ── */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          ¿Lo tenemos?
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Cuando un cliente pida algo, escríbelo o muéstralo a la cámara y
          comprobamos el inventario.
        </p>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            buscar(consulta);
          }}
        >
          <div className="relative flex-1">
            <MagnifyingGlass
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <label htmlFor="consulta-cliente" className="sr-only">
              Producto que pide el cliente
            </label>
            <input
              id="consulta-cliente"
              type="text"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Ej.: aceite de oliva 1L"
              className="h-11 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
          <button
            type="submit"
            disabled={!consulta.trim() || analizando}
            className="h-11 rounded-full bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white px-5 text-sm font-medium text-white transition duration-150 ease-out hover:bg-zinc-700 disabled:opacity-40 active:scale-[0.98]"
          >
            Comprobar
          </button>
          <button
            type="button"
            onClick={() => {
              setCamaraAbierta((v) => !v);
              setError(null);
            }}
            disabled={analizando}
            aria-label={camaraAbierta ? "Cerrar cámara" : "Mostrar producto a la cámara"}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 transition duration-150 ease-out hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 active:scale-95"
          >
            {camaraAbierta ? <X size={18} /> : <Camera size={18} />}
          </button>
        </form>

        <AnimatePresence>
          {camaraAbierta && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <CapturaFoto onCapturar={buscarPorFoto} etiqueta="Identificar producto" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {analizando && (
          <p className="mt-4 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <CircleNotch size={16} className="animate-spin text-emerald-600" />
            Identificando el producto…
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <AnimatePresence mode="wait">
          {resultado && (
            <motion.div
              key={resultado.termino + resultado.encontrados.length}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="mt-4"
            >
              {resultado.encontrados.length > 0 ? (
                <div className="rounded-2xl border border-emerald-600/40 bg-emerald-600/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle size={18} weight="fill" />
                    Sí, lo tenemos
                  </p>
                  <ul className="mt-3 space-y-2">
                    {resultado.encontrados.slice(0, 3).map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-zinc-900 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {p.nombre}
                          </p>
                          {p.descripcion && (
                            <p className="truncate text-xs text-zinc-500">
                              {p.descripcion}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 font-mono text-sm tabular-nums ${
                            p.cantidad > 0
                              ? "text-zinc-900 dark:text-zinc-50"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {p.cantidad > 0 ? `${p.cantidad} uds.` : "agotado"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    <XCircle size={18} weight="fill" className="text-zinc-400" />
                    No tenemos «{resultado.termino}»
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Apúntalo y te quedará como recordatorio para el próximo pedido.
                  </p>
                  <button
                    type="button"
                    onClick={apuntar}
                    disabled={apuntando}
                    className="mt-3 flex h-10 items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-medium text-white transition duration-150 ease-out hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {apuntando ? (
                      <CircleNotch size={15} className="animate-spin" />
                    ) : (
                      <NotePencil size={15} weight="bold" />
                    )}
                    Apuntar para pedir
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Hoja de pendientes ── */}
      <section>
        <h2 className="mb-3 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Pendientes por pedir
          {pedidos.length > 0 && (
            <span className="ml-2 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
              {pedidos.length}
            </span>
          )}
        </h2>

        {pedidos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-12 text-center">
            <ClipboardText size={32} weight="duotone" className="text-zinc-300" />
            <p className="max-w-[40ch] text-sm text-zinc-500">
              Nada pendiente. Cuando un cliente pida algo que no tengas,
              apúntalo aquí.
            </p>
          </div>
        ) : (
          <motion.ul layout className="space-y-2">
            {pedidos.map((pedido) => (
              <motion.li
                key={pedido.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {pedido.nombre}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {pedido.notas ? `${pedido.notas} · ` : ""}
                    {new Date(pedido.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onEliminarPedido(pedido.id)}
                  aria-label={`Quitar ${pedido.nombre} de pendientes`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition duration-150 ease-out hover:bg-emerald-600/10 hover:text-emerald-700 dark:hover:text-emerald-400 active:scale-95"
                >
                  <Trash size={16} />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </section>
    </div>
  );
}
