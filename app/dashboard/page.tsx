"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Barcode, SignOut } from "@phosphor-icons/react";
import type { User } from "@supabase/supabase-js";
import Inventario from "@/components/Inventario";
import {
  supabase,
  isSupabaseConfigured,
  type Plan,
  type Producto,
} from "@/lib/supabase";
import {
  obtenerProductos,
  agregarProducto,
  actualizarCantidad,
  eliminarProducto,
  type ProductoEscaneado,
} from "@/lib/productos";

export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<User | null>(null);
  const [plan, setPlan] = useState<Plan>("gratuito");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      router.replace("/auth/login");
      return;
    }
    let activo = true;

    const cargar = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!activo) return;
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      setUsuario(user);

      try {
        const [{ data: perfil }, lista] = await Promise.all([
          supabase.from("perfiles").select("plan").eq("id", user.id).single(),
          obtenerProductos(user.id),
        ]);
        if (!activo) return;
        if (perfil?.plan) setPlan(perfil.plan as Plan);
        setProductos(lista);
      } catch (e) {
        if (activo) {
          setError(
            e instanceof Error ? e.message : "No se pudo cargar el inventario."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();
    return () => {
      activo = false;
    };
  }, [router]);

  const manejarAgregar = useCallback(
    async (escaneado: ProductoEscaneado, cantidad: number) => {
      if (!usuario) return;
      const nuevo = await agregarProducto(usuario.id, escaneado, cantidad);
      setProductos((prev) => [nuevo, ...prev]);
    },
    [usuario]
  );

  const manejarCantidad = useCallback((id: string, cantidad: number) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad } : p))
    );
    actualizarCantidad(id, cantidad).catch(() =>
      setError("No se pudo guardar la cantidad. Vuelve a intentarlo.")
    );
  }, []);

  const manejarEliminar = useCallback((id: string) => {
    setProductos((prev) => prev.filter((p) => p.id !== id));
    eliminarProducto(id).catch(() =>
      setError("No se pudo eliminar el producto. Recarga la página.")
    );
  }, []);

  const salir = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

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
          <div className="flex items-center gap-3">
            {usuario && (
              <span className="hidden max-w-[24ch] truncate text-sm text-zinc-500 sm:block">
                {usuario.email}
              </span>
            )}
            <button
              type="button"
              onClick={salir}
              className="flex items-center gap-2 rounded-full border border-zinc-300 px-3.5 py-2 text-sm text-zinc-700 transition duration-150 ease-out hover:bg-zinc-100 active:scale-[0.98]"
            >
              <SignOut size={15} />
              Salir
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
          Mi inventario
        </h1>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <Inventario
          productos={productos}
          plan={plan}
          cargando={cargando}
          onAgregar={manejarAgregar}
          onCambiarCantidad={manejarCantidad}
          onEliminar={manejarEliminar}
        />
      </main>
    </div>
  );
}
