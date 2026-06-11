"use client";

import Image from "next/image";
import { Minus, Plus, Trash, Barcode } from "@phosphor-icons/react";
import type { Producto } from "@/lib/supabase";

interface ProductoCardProps {
  producto: Producto;
  onCambiarCantidad: (id: string, cantidad: number) => void;
  onEliminar: (id: string) => void;
}

export default function ProductoCard({
  producto,
  onCambiarCantidad,
  onEliminar,
}: ProductoCardProps) {
  return (
    <article className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="56px"
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Barcode size={24} weight="duotone" className="text-zinc-400" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-zinc-900">
          {producto.nombre}
        </h3>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-mono">{producto.codigo}</span>
          {producto.categoria && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate capitalize">{producto.categoria}</span>
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-1">
        <button
          type="button"
          onClick={() =>
            onCambiarCantidad(producto.id, Math.max(0, producto.cantidad - 1))
          }
          aria-label={`Reducir cantidad de ${producto.nombre}`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 transition duration-150 ease-out hover:bg-white hover:text-zinc-900 active:scale-95"
        >
          <Minus size={14} weight="bold" />
        </button>
        <span className="w-8 text-center font-mono text-sm tabular-nums text-zinc-900">
          {producto.cantidad}
        </span>
        <button
          type="button"
          onClick={() => onCambiarCantidad(producto.id, producto.cantidad + 1)}
          aria-label={`Aumentar cantidad de ${producto.nombre}`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 transition duration-150 ease-out hover:bg-white hover:text-zinc-900 active:scale-95"
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onEliminar(producto.id)}
        aria-label={`Eliminar ${producto.nombre}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition duration-150 ease-out hover:bg-red-50 hover:text-red-600 active:scale-95"
      >
        <Trash size={16} />
      </button>
    </article>
  );
}
