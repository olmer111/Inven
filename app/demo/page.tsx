"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Barcode } from "@phosphor-icons/react";
import Inventario from "@/components/Inventario";
import Pedidos from "@/components/Pedidos";
import ThemeToggle from "@/components/ThemeToggle";
import { PRODUCTOS_DEMO } from "@/lib/demo-data";
import type { Producto, Pedido } from "@/lib/supabase";
import type { ProductoEscaneado } from "@/lib/productos";

type Pestana = "inventario" | "pedidos";

export default function DemoPage() {
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_DEMO);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pestana, setPestana] = useState<Pestana>("inventario");

  const manejarAgregar = useCallback(
    async (escaneado: ProductoEscaneado, cantidad: number) => {
      const nuevo: Producto = {
        id: `demo-${Date.now()}`,
        user_id: "demo",
        codigo: escaneado.codigo,
        nombre: escaneado.nombre,
        categoria: escaneado.categoria,
        imagen_url: escaneado.imagen_url,
        descripcion: escaneado.descripcion,
        especificaciones: escaneado.especificaciones,
        precio: escaneado.precio,
        cantidad,
        created_at: new Date().toISOString(),
      };
      setProductos((prev) => [nuevo, ...prev]);
    },
    []
  );

  const manejarCantidad = useCallback((id: string, cantidad: number) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad } : p))
    );
  }, []);

  const manejarPrecio = useCallback((id: string, precio: number | null) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, precio } : p))
    );
  }, []);

  const manejarEliminar = useCallback((id: string) => {
    setProductos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const manejarAgregarPedido = useCallback(
    async (nombre: string, notas: string | null) => {
      const nuevo: Pedido = {
        id: `pedido-${Date.now()}`,
        user_id: "demo",
        nombre,
        notas,
        created_at: new Date().toISOString(),
      };
      setPedidos((prev) => [nuevo, ...prev]);
    },
    []
  );

  const manejarEliminarPedido = useCallback((id: string) => {
    setPedidos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 dark:border-zinc-800/70 bg-background/85 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            <Barcode size={22} weight="bold" className="text-emerald-600" />
            StockScan
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/auth/register"
              className="rounded-full bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {pestana === "inventario" ? "Demo del inventario" : "Pedidos de clientes"}
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Datos de ejemplo, sin cuenta. Los cambios se pierden al recargar.
            </p>
          </div>
          <div className="flex rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1">
            {(
              [
                ["inventario", "Inventario"],
                ["pedidos", "Pedidos"],
              ] as [Pestana, string][]
            ).map(([clave, etiqueta]) => (
              <button
                key={clave}
                type="button"
                onClick={() => setPestana(clave)}
                className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  pestana === clave
                    ? "text-white"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {pestana === clave && (
                  <motion.span
                    layoutId="pestana-activa-demo"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    className="absolute inset-0 rounded-full bg-emerald-600"
                  />
                )}
                <span className="relative">{etiqueta}</span>
              </button>
            ))}
          </div>
        </div>

        {pestana === "inventario" ? (
          <Inventario
            productos={productos}
            plan="gratuito"
            onAgregar={manejarAgregar}
            onCambiarCantidad={manejarCantidad}
            onCambiarPrecio={manejarPrecio}
            onEliminar={manejarEliminar}
          />
        ) : (
          <Pedidos
            productos={productos}
            pedidos={pedidos}
            onAgregarPedido={manejarAgregarPedido}
            onEliminarPedido={manejarEliminarPedido}
          />
        )}
      </main>
    </div>
  );
}
