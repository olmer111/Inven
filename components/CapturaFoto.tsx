"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Camera, CameraSlash } from "@phosphor-icons/react";

interface CapturaFotoProps {
  onCapturar: (imagenDataUrl: string) => void;
  /** Texto del botón de disparo. */
  etiqueta?: string;
}

/** Vista de cámara con botón de disparo; devuelve la foto como data URL JPEG
    redimensionada a máx. 1024px para mantener controlado el coste de la IA. */
export default function CapturaFoto({
  onCapturar,
  etiqueta = "Capturar",
}: CapturaFotoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setListo(true);
      })
      .catch(() => {
        if (!cancelado) {
          setError(
            "No se pudo acceder a la cámara. Revisa los permisos del navegador."
          );
        }
      });

    return () => {
      cancelado = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const capturar = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const escala = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * escala);
    canvas.height = Math.round(video.videoHeight * escala);
    canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapturar(canvas.toDataURL("image/jpeg", 0.85));
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-6 py-10 text-center">
        <CameraSlash size={32} weight="duotone" className="text-zinc-400" />
        <p className="max-w-[36ch] text-sm text-zinc-600 dark:text-zinc-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-zinc-950">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-[4/3] w-full object-cover"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-4 rounded-xl border-2 border-white/40"
        />
      </div>
      <motion.button
        type="button"
        onClick={capturar}
        disabled={!listo}
        whileTap={{ scale: 0.97 }}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-medium text-white transition duration-150 ease-out hover:bg-emerald-700 disabled:opacity-50"
      >
        <Camera size={16} weight="bold" />
        {etiqueta}
      </motion.button>
    </div>
  );
}
