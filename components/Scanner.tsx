"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CameraSlash } from "@phosphor-icons/react";

interface ScannerProps {
  onScan: (codigo: string) => void;
  activo: boolean;
}

export default function Scanner({ onScan, activo }: ScannerProps) {
  const contenedorId = "stockscan-camara";
  const lectorRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!activo) return;
    let cancelado = false;
    const lector = new Html5Qrcode(contenedorId);
    lectorRef.current = lector;

    lector
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 160 } },
        (texto) => {
          onScanRef.current(texto);
        },
        () => {
          // Frames sin código legible: ignorar.
        }
      )
      .catch(() => {
        if (!cancelado) {
          setError(
            "No se pudo acceder a la cámara. Revisa los permisos del navegador o escribe el código a mano."
          );
        }
      });

    return () => {
      cancelado = true;
      if (lector.isScanning) {
        lector.stop().then(() => lector.clear()).catch(() => {});
      } else {
        lector.clear();
      }
      lectorRef.current = null;
    };
  }, [activo]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
        <CameraSlash size={32} weight="duotone" className="text-zinc-400" />
        <p className="text-sm text-zinc-600 max-w-[36ch]">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-950">
      <div id={contenedorId} className="w-full [&_video]:!rounded-2xl" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[160px] w-[240px] rounded-lg border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(9,9,11,0.45)]" />
      </div>
    </div>
  );
}
