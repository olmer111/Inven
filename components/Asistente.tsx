"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PaperPlaneTilt, Trash, Check, CaretDown } from "@phosphor-icons/react";
import type { User } from "@supabase/supabase-js";
import type { Producto, Pedido } from "@/lib/supabase";
import { obtenerProductos } from "@/lib/productos";
import { obtenerPedidos } from "@/lib/pedidos";
import { guardarCombo, obtenerCombos, eliminarCombo, type Combo, type ComboItem } from "@/lib/combos";
import {
  enviarMensajeAsistente,
  parseCombos,
  type MensajeChat,
  type ComboPropuesto,
  type ParteRespuesta,
} from "@/lib/asistente";
import { formatearCOP } from "@/lib/moneda";
import { supabase } from "@/lib/supabase";

const CHAT_KEY = "stockscan_chat_v1";
const MAX_MENSAJES = 50;

const SUGERENCIAS = [
  "¿Qué me recomiendas para la gripa?",
  "Hazme un presupuesto de un combo de aseo",
  "¿Qué productos tienen poco stock?",
  "¿Qué productos no tienen precio?",
];

interface AsistenteProps {
  productos?: Producto[];
  pedidos?: Pedido[];
  usuario: User | null;
}

function ComboCard({
  combo,
  productos,
  usuario,
  onGuardado,
}: {
  combo: ComboPropuesto;
  productos: Producto[];
  usuario: User | null;
  onGuardado: () => void;
}) {
  const [estado, setEstado] = useState<"idle" | "guardando" | "guardado">("idle");

  const guardar = async () => {
    if (!usuario || estado !== "idle") return;
    setEstado("guardando");
    try {
      const items: ComboItem[] = combo.items.map((it) => {
        const match = productos.find(
          (p) => p.codigo === it.codigo || p.nombre.toLowerCase() === it.nombre.toLowerCase()
        );
        return {
          producto_id: match?.id ?? null,
          nombre: it.nombre,
          cantidad: it.cantidad,
          precio: it.precio,
        };
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sin sesión");
      await guardarCombo(user.id, combo.nombre, combo.descripcion || null, items, combo.precio_total);
      setEstado("guardado");
      onGuardado();
    } catch {
      setEstado("idle");
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{combo.nombre}</p>
        {combo.descripcion && (
          <p className="mt-0.5 text-xs text-zinc-500">{combo.descripcion}</p>
        )}
      </div>
      <ul className="space-y-1">
        {combo.items.map((it, i) => (
          <li key={i} className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300">
            <span>{it.cantidad} × {it.nombre}</span>
            <span className="font-mono text-zinc-500">
              {it.precio != null ? formatearCOP(it.precio) : "—"}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-emerald-500/20 pt-2">
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
          Total: {combo.precio_total != null ? formatearCOP(combo.precio_total) : "precio incompleto"}
        </span>
        <button
          type="button"
          onClick={guardar}
          disabled={estado !== "idle"}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            estado === "guardado"
              ? "bg-emerald-600 text-white"
              : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
          }`}
        >
          {estado === "guardado" ? (
            <><Check size={12} weight="bold" /> Guardado</>
          ) : estado === "guardando" ? (
            "Guardando…"
          ) : (
            "Guardar combo"
          )}
        </button>
      </div>
    </div>
  );
}

function CombosGuardados({
  combos,
  onEliminar,
}: {
  combos: Combo[];
  onEliminar: (id: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  if (combos.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <span>Combos guardados ({combos.length})</span>
        <motion.span animate={{ rotate: abierto ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <CaretDown size={16} className="text-zinc-400" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {combos.map((c) => (
                <div key={c.id} className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{c.nombre}</p>
                    <button
                      type="button"
                      onClick={() => onEliminar(c.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-colors"
                      aria-label="Eliminar combo"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                  {(c.items as ComboItem[]).map((it, i) => (
                    <p key={i} className="text-xs text-zinc-500">
                      {it.cantidad} × {it.nombre}
                      {it.precio != null ? ` — ${formatearCOP(it.precio)}` : ""}
                    </p>
                  ))}
                  {c.precio_total != null && (
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Total: {formatearCOP(c.precio_total)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Asistente({ productos: productosProp, pedidos: pedidosProp, usuario }: AsistenteProps) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(CHAT_KEY);
      return raw ? (JSON.parse(raw) as MensajeChat[]) : [];
    } catch {
      return [];
    }
  });
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>(productosProp ?? []);
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosProp ?? []);
  const [combos, setCombos] = useState<Combo[]>([]);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (productosProp !== undefined) queueMicrotask(() => setProductos(productosProp));
    if (pedidosProp !== undefined) queueMicrotask(() => setPedidos(pedidosProp));
  }, [productosProp, pedidosProp]);

  useEffect(() => {
    if (productosProp !== undefined || !usuario) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      obtenerProductos(user.id).then(setProductos).catch(() => {});
      obtenerPedidos(user.id).then(setPedidos).catch(() => {});
    });
  }, [productosProp, usuario]);

  const cargarCombos = useCallback(() => {
    if (!usuario) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      obtenerCombos(user.id).then(setCombos).catch(() => {});
    });
  }, [usuario]);

  useEffect(() => { cargarCombos(); }, [cargarCombos]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(mensajes.slice(-MAX_MENSAJES)));
    } catch {}
  }, [mensajes]);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes, cargando]);

  const enviar = async (texto: string) => {
    const txt = texto.trim();
    if (!txt || cargando) return;
    setEntrada("");
    setError(null);

    const nuevos: MensajeChat[] = [...mensajes, { rol: "usuario", contenido: txt }];
    setMensajes(nuevos);
    setCargando(true);

    try {
      const respuesta = await enviarMensajeAsistente(nuevos, productos, pedidos);
      setMensajes((prev) => [...prev, { rol: "asistente", contenido: respuesta }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al conectar con el asistente.");
    } finally {
      setCargando(false);
    }
  };

  const borrarConversacion = () => {
    setMensajes([]);
    setError(null);
    try { localStorage.removeItem(CHAT_KEY); } catch {}
  };

  const eliminarComboGuardado = async (id: string) => {
    setCombos((prev) => prev.filter((c) => c.id !== id));
    eliminarCombo(id).catch(() => cargarCombos());
  };

  return (
    <div className="flex flex-col gap-4">
      <CombosGuardados combos={combos} onEliminar={eliminarComboGuardado} />

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col" style={{ minHeight: "480px", maxHeight: "60dvh" }}>
        <div ref={listaRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {mensajes.length === 0 && !cargando && (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-8">
              <p className="text-sm text-zinc-500 text-center">
                Pregúntame sobre tu inventario, pídeme combos o presupuestos.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGERENCIAS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => enviar(s)}
                    className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 transition-colors hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mensajes.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.rol === "usuario" ? "justify-end" : "justify-start"}`}
            >
              {msg.rol === "usuario" ? (
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-emerald-600 px-4 py-2.5 text-sm text-white">
                  {msg.contenido}
                </div>
              ) : (
                <div className="max-w-[90%] space-y-2">
                  {(parseCombos(msg.contenido) as ParteRespuesta[]).map((parte, j) =>
                    typeof parte === "string" ? (
                      <div
                        key={j}
                        className="rounded-2xl rounded-tl-sm bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 whitespace-pre-wrap"
                      >
                        {parte}
                      </div>
                    ) : (
                      <ComboCard
                        key={j}
                        combo={parte}
                        productos={productos}
                        usuario={usuario}
                        onGuardado={cargarCombos}
                      />
                    )
                  )}
                </div>
              )}
            </motion.div>
          ))}

          {cargando && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-zinc-100 dark:bg-zinc-800 px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {error && (
          <div className="mx-4 mb-2">
            <p className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        )}

        <div className="border-t border-zinc-100 dark:border-zinc-800 p-3 flex items-center gap-2">
          <input
            type="text"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(entrada); }}}
            placeholder="Pregunta algo sobre tu inventario…"
            disabled={cargando}
            className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-colors"
          />
          <button
            type="button"
            onClick={() => enviar(entrada)}
            disabled={cargando || !entrada.trim()}
            aria-label="Enviar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition duration-150 ease-out hover:bg-emerald-700 disabled:opacity-40 active:scale-95"
          >
            <PaperPlaneTilt size={18} weight="fill" />
          </button>
        </div>
      </div>

      {mensajes.length > 0 && (
        <button
          type="button"
          onClick={borrarConversacion}
          className="self-center text-xs text-zinc-400 hover:text-red-500 transition-colors"
        >
          Borrar conversación
        </button>
      )}
    </div>
  );
}
