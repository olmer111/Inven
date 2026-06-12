"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  MagnifyingGlass,
  CircleNotch,
  Barcode,
  Sparkle,
  QrCode,
  ArrowLeft,
} from "@phosphor-icons/react";
import Scanner from "./Scanner";
import CapturaFoto from "./CapturaFoto";
import {
  buscarProductoPorCodigo,
  type ProductoEscaneado,
} from "@/lib/productos";
import { reconocerProducto, generarCodigoInterno } from "@/lib/reconocer";

interface ModalAgregarProductoProps {
  abierto: boolean;
  onCerrar: () => void;
  onAgregar: (producto: ProductoEscaneado, cantidad: number) => Promise<void>;
  codigosExistentes?: Set<string>;
}

type Paso =
  | "metodo"
  | "codigo"
  | "foto"
  | "analizando"
  | "pedir-codigo"
  | "confirmar";

const TITULOS: Record<Paso, string> = {
  metodo: "Agregar producto",
  codigo: "Escanear código",
  foto: "Foto del producto",
  analizando: "Analizando…",
  "pedir-codigo": "Producto reconocido",
  confirmar: "Confirmar producto",
};

const claseInput =
  "h-11 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

export default function ModalAgregarProducto({
  abierto,
  onCerrar,
  onAgregar,
  codigosExistentes,
}: ModalAgregarProductoProps) {
  const [paso, setPaso] = useState<Paso>("metodo");
  const [codigoManual, setCodigoManual] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [producto, setProducto] = useState<ProductoEscaneado | null>(null);
  const [cantidad, setCantidad] = useState(1);

  const reiniciar = () => {
    setPaso("metodo");
    setCodigoManual("");
    setFoto(null);
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
    if (codigosExistentes?.has(codigo)) {
      setError("Este producto ya está en tu inventario.");
      return;
    }
    setBuscando(true);
    setError(null);
    const encontrado = await buscarProductoPorCodigo(codigo);
    setProducto(
      encontrado ?? {
        codigo,
        nombre: "",
        categoria: null,
        imagen_url: null,
        descripcion: null,
        especificaciones: null,
        precio: null,
      }
    );
    setBuscando(false);
    setPaso("confirmar");
  };

  const analizarFoto = async (imagen: string) => {
    setFoto(imagen);
    setPaso("analizando");
    setError(null);
    try {
      const r = await reconocerProducto(imagen);
      setProducto({
        codigo: "",
        nombre: r.reconocido ? r.nombre : "",
        categoria: r.categoria || null,
        imagen_url: null,
        descripcion: r.descripcion || null,
        especificaciones: r.especificaciones.length ? r.especificaciones : null,
        precio: null,
      });
      setPaso("pedir-codigo");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo analizar la foto.");
      setPaso("foto");
    }
  };

  const asignarCodigo = (codigo: string) => {
    if (!producto) return;
    if (codigosExistentes?.has(codigo)) {
      setError("Este producto ya está en tu inventario.");
      return;
    }
    setError(null);
    setProducto({ ...producto, codigo });
    setPaso("confirmar");
  };

  const guardar = async () => {
    if (!producto || !producto.nombre.trim()) {
      setError("El producto necesita un nombre.");
      return;
    }
    const codigoFinal = producto.codigo || generarCodigoInterno();
    if (codigosExistentes?.has(codigoFinal)) {
      setError("Este producto ya está en tu inventario.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await onAgregar(
        {
          ...producto,
          nombre: producto.nombre.trim(),
          codigo: codigoFinal,
        },
        cantidad
      );
      cerrar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el producto.");
      setGuardando(false);
    }
  };

  const esCodigoInterno = producto?.codigo.startsWith("SC-") ?? false;

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
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {paso !== "metodo" && paso !== "analizando" && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setPaso(paso === "confirmar" && foto ? "pedir-codigo" : "metodo");
                    }}
                    aria-label="Volver"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition duration-150 ease-out hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-95"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {TITULOS[paso]}
                </h2>
              </div>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition duration-150 ease-out hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={paso}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                {paso === "metodo" && (
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => setPaso("codigo")}
                      className="flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-left transition duration-150 ease-out hover:border-emerald-600 hover:bg-emerald-600/5 active:scale-[0.99]"
                    >
                      <Barcode size={28} weight="duotone" className="shrink-0 text-emerald-600" />
                      <span>
                        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          Escanear código
                        </span>
                        <span className="block text-xs text-zinc-500">
                          Código de barras o QR; lo buscamos en Open Food Facts.
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaso("foto")}
                      className="flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-left transition duration-150 ease-out hover:border-emerald-600 hover:bg-emerald-600/5 active:scale-[0.99]"
                    >
                      <Sparkle size={28} weight="duotone" className="shrink-0 text-emerald-600" />
                      <span>
                        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          Reconocer con IA
                        </span>
                        <span className="block text-xs text-zinc-500">
                          Haz una foto y la IA identifica el producto, aunque no
                          tenga código.
                        </span>
                      </span>
                    </button>
                  </div>
                )}

                {paso === "codigo" && (
                  <div className="space-y-4">
                    <Scanner activo={abierto && paso === "codigo"} onScan={procesarCodigo} />

                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                      o escribe el código
                      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
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
                        onChange={(e) => { setCodigoManual(e.target.value); setError(null); }}
                        placeholder="8480000123456"
                        className={`${claseInput} flex-1 font-mono`}
                      />
                      <button
                        type="submit"
                        disabled={buscando || !codigoManual.trim()}
                        className="flex h-11 items-center gap-2 rounded-full bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white px-5 text-sm font-medium text-white transition duration-150 ease-out hover:bg-zinc-700 disabled:opacity-40 active:scale-[0.98]"
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
                    {error && (
                      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    )}
                  </div>
                )}

                {paso === "foto" && (
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Encuadra el producto completo y con buena luz.
                    </p>
                    <CapturaFoto onCapturar={analizarFoto} etiqueta="Hacer foto" />
                    {error && (
                      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    )}
                  </div>
                )}

                {paso === "analizando" && foto && (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={foto} alt="Foto capturada del producto" className="w-full" />
                      <div className="absolute inset-0 bg-zinc-950/30" />
                      {/* Línea de escaneo: comunica que la IA está procesando. */}
                      <motion.div
                        aria-hidden
                        initial={{ top: "0%" }}
                        animate={{ top: ["0%", "96%", "0%"] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-x-3 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_16px_2px_rgba(52,211,153,0.7)]"
                      />
                    </div>
                    <p className="flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <CircleNotch size={16} className="animate-spin text-emerald-600" />
                      Identificando el producto…
                    </p>
                  </div>
                )}

                {paso === "pedir-codigo" && producto && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-600/40 bg-emerald-600/5 p-4">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {producto.nombre || "Producto sin identificar"}
                      </p>
                      {producto.descripcion && (
                        <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {producto.descripcion}
                        </p>
                      )}
                      {producto.especificaciones && (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {producto.especificaciones.map((e) => (
                            <li
                              key={e}
                              className="rounded-full bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-600 dark:text-zinc-400"
                            >
                              {e}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <p className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <QrCode size={18} className="shrink-0 text-emerald-600" />
                      Ahora escanea su código de barras o QR para enlazarlo.
                    </p>
                    <Scanner
                      activo={abierto && paso === "pedir-codigo"}
                      onScan={asignarCodigo}
                    />
                    {error && (
                      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setPaso("confirmar")}
                      className="h-11 w-full rounded-full border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition duration-150 ease-out hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98]"
                    >
                      No tiene código — usar código interno
                    </button>
                  </div>
                )}

                {paso === "confirmar" && producto && (
                  <div className="space-y-4">
                    {producto.imagen_url && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={producto.imagen_url}
                        alt={producto.nombre || "Producto escaneado"}
                        className="mx-auto h-28 w-28 rounded-lg bg-zinc-100 dark:bg-zinc-800 object-contain"
                      />
                    )}

                    <div className="space-y-1.5">
                      <label
                        htmlFor="nombre-producto"
                        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
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
                        className={claseInput}
                      />
                      {!producto.nombre && (
                        <p className="text-xs text-zinc-500">
                          No pudimos identificarlo automáticamente; ponle un nombre.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="descripcion-producto"
                        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Descripción{" "}
                        <span className="font-normal text-zinc-400">(para qué sirve)</span>
                      </label>
                      <textarea
                        id="descripcion-producto"
                        rows={2}
                        value={producto.descripcion ?? ""}
                        onChange={(e) =>
                          setProducto({
                            ...producto,
                            descripcion: e.target.value || null,
                          })
                        }
                        placeholder="Ej.: limpiador multiusos para superficies de cocina"
                        className={`${claseInput} h-auto resize-none py-2.5`}
                      />
                    </div>

                    {producto.especificaciones && (
                      <ul className="flex flex-wrap gap-1.5">
                        {producto.especificaciones.map((e) => (
                          <li
                            key={e}
                            className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-600 dark:text-zinc-400"
                          >
                            {e}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2.5">
                      <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                        {producto.codigo || "Se generará un código interno"}
                      </span>
                      {(esCodigoInterno || !producto.codigo) && (
                        <span className="rounded-full bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                          interno
                        </span>
                      )}
                      {producto.categoria && producto.codigo && !esCodigoInterno && (
                        <span className="truncate pl-3 text-xs capitalize text-zinc-500">
                          {producto.categoria}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="precio-producto"
                        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Precio{" "}
                        <span className="font-normal text-zinc-400">(COP, opcional)</span>
                      </label>
                      <input
                        id="precio-producto"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={50}
                        value={producto.precio ?? ""}
                        onChange={(e) =>
                          setProducto({
                            ...producto,
                            precio: e.target.value === "" ? null : Math.max(0, Number(e.target.value)),
                          })
                        }
                        placeholder="Ej.: 12000"
                        className={`${claseInput} font-mono`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="cantidad-producto"
                        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
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
                        className={`${claseInput} font-mono`}
                      />
                    </div>

                    {error && (
                      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={guardar}
                      disabled={guardando}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-medium text-white transition duration-150 ease-out hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.98]"
                    >
                      {guardando && <CircleNotch size={16} className="animate-spin" />}
                      Guardar en el inventario
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
