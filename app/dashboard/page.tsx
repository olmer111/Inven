"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Barcode, Gear, SignOut } from "@phosphor-icons/react";
import type { User } from "@supabase/supabase-js";
import Inventario from "@/components/Inventario";
import Pedidos from "@/components/Pedidos";
import ThemeToggle from "@/components/ThemeToggle";
import {
  supabase,
  isSupabaseConfigured,
  type Plan,
  type Producto,
  type Pedido,
} from "@/lib/supabase";
import {
  obtenerProductos,
  agregarProducto,
  actualizarCantidad,
  eliminarProducto,
  type ProductoEscaneado,
} from "@/lib/productos";
import { obtenerPedidos, agregarPedido, eliminarPedido } from "@/lib/pedidos";

type Pestana = "inventario" | "pedidos";

export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<User | null>(null);
  const [plan, setPlan] = useState<Plan>("gratuito");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pestana, setPestana] = useState<Pestana>("inventario");
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
        const [{ data: perfil }, lista, listaPedidos] = await Promise.all([
          supabase.from("perfiles").select("plan").eq("id", user.id).single(),
          obtenerProductos(user.id),
          obtenerPedidos(user.id),
        ]);
        if (!activo) return;
        if (perfil?.plan) setPlan(perfil.plan as Plan);
        setProductos(lista);
        setPedidos(listaPedidos);
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

  const manejarAgregarPedido = useCallback(
    async (nombre: string, notas: string | null) => {
      if (!usuario) return;
      const nuevo = await agregarPedido(usuario.id, nombre, notas);
      setPedidos((prev) => [nuevo, ...prev]);
    },
    [usuario]
  );

  const manejarEliminarPedido = useCallback((id: string) => {
    setPedidos((prev) => prev.filter((p) => p.id !== id));
    eliminarPedido(id).catch(() =>
      setError("No se pudo quitar el pedido. Recarga la página.")
    );
  }, []);

  const salir = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

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
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/configuracion"
              aria-label="Configuración"
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 dark:text-zinc-400 transition duration-150 ease-out hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <Gear size={18} />
            </Link>
            {usuario && (
              <span className="hidden max-w-[24ch] truncate text-sm text-zinc-500 sm:block">
                {usuario.email}
              </span>
            )}
            <button
              type="button"
              onClick={salir}
              className="flex items-center gap-2 rounded-full border border-zinc-300 dark:border-zinc-700 px-3.5 py-2 text-sm text-zinc-700 dark:text-zinc-300 transition duration-150 ease-out hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98]"
            >
              <SignOut size={15} />
              Salir
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {pestana === "inventario" ? "Mi inventario" : "Pedidos de clientes"}
          </h1>
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
                    layoutId="pestana-activa"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    className="absolute inset-0 rounded-full bg-emerald-600"
                  />
                )}
                <span className="relative">{etiqueta}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300"
          >
            {error}
          </p>
        )}

        {pestana === "inventario" ? (
          <Inventario
            productos={productos}
            plan={plan}
            cargando={cargando}
            onAgregar={manejarAgregar}
            onCambiarCantidad={manejarCantidad}
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
