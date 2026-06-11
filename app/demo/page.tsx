"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Barcode } from "@phosphor-icons/react";
import Inventario from "@/components/Inventario";
import { PRODUCTOS_DEMO } from "@/lib/demo-data";
import type { Producto } from "@/lib/supabase";
import type { ProductoEscaneado } from "@/lib/productos";

export default function DemoPage() {
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_DEMO);

  const manejarAgregar = useCallback(
    async (escaneado: ProductoEscaneado, cantidad: number) => {
      const nuevo: Producto = {
        id: `demo-${Date.now()}`,
        user_id: "demo",
        codigo: escaneado.codigo,
        nombre: escaneado.nombre,
        categoria: escaneado.categoria,
        imagen_url: escaneado.imagen_url,
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

  const manejarEliminar = useCallback((id: string) => {
    setProductos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-[#fafafa]/85 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900"
          >
            <Barcode size={22} weight="bold" className="text-emerald-600" />
            StockScan
          </Link>
          <Link
            href="/auth/register"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Crear cuenta gratis
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Demo del inventario
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Datos de ejemplo, sin cuenta. Los cambios se pierden al recargar:
            todo, incluido el escáner, funciona igual que en tu inventario real.
          </p>
        </div>

        <Inventario
          productos={productos}
          plan="gratuito"
          onAgregar={manejarAgregar}
          onCambiarCantidad={manejarCantidad}
          onEliminar={manejarEliminar}
        />
      </main>
    </div>
  );
}
