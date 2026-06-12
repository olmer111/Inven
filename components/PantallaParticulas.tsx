"use client";

import { useEffect, useRef, useCallback } from "react";

interface Props {
  nombre: string;
  onComplete: () => void;
}

interface Particula {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  alpha: number;
  r: number;
  g: number;
  b: number;
  size: number;
  exploding: boolean;
  evx: number;
  evy: number;
}

type Fase = "assembling" | "hold1" | "transitioning" | "hold2" | "exploding" | "done";

function muestrearTexto(
  texto: string,
  fuente: string,
  anchoCanvas: number,
  altoCanvas: number,
  paso: number
): { x: number; y: number }[] {
  const offscreen = document.createElement("canvas");
  offscreen.width = anchoCanvas;
  offscreen.height = altoCanvas;
  const ctx = offscreen.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.font = fuente;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texto, anchoCanvas / 2, altoCanvas / 2);
  const datos = ctx.getImageData(0, 0, anchoCanvas, altoCanvas).data;
  const puntos: { x: number; y: number }[] = [];
  for (let y = 0; y < altoCanvas; y += paso) {
    for (let x = 0; x < anchoCanvas; x += paso) {
      const idx = (y * anchoCanvas + x) * 4;
      if (datos[idx + 3] > 128) {
        puntos.push({ x, y });
      }
    }
  }
  return puntos;
}

export default function PantallaParticulas({ nombre, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const completadoRef = useRef(false);
  const rafRef = useRef<number>(0);

  const llamarComplete = useCallback(() => {
    if (completadoRef.current) return;
    completadoRef.current = true;
    cancelAnimationFrame(rafRef.current);
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio ?? 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const FUENTE_BIENVENIDO = `bold ${Math.min(96, W / 8)}px system-ui, sans-serif`;
    const FUENTE_NOMBRE = `bold ${Math.min(80, W / 9)}px system-ui, sans-serif`;
    const PASO = Math.max(3, Math.round(W / 200));

    const puntosB = muestrearTexto("BIENVENIDO", FUENTE_BIENVENIDO, W, H, PASO);
    const puntosN = muestrearTexto(
      nombre.toUpperCase(),
      FUENTE_NOMBRE,
      W,
      H,
      PASO
    );

    const particulas: Particula[] = puntosB.map((p) => ({
      x: Math.random() * W,
      y: Math.random() * -H,
      tx: p.x,
      ty: p.y,
      vx: 0,
      vy: 0,
      alpha: 1,
      r: 16,
      g: 185,
      b: 129,
      size: Math.random() * 1.5 + 0.8,
      exploding: false,
      evx: 0,
      evy: 0,
    }));

    let fase: Fase = "assembling";
    let faseInicio = performance.now();
    const HOLD1 = 1000;
    const TRANSITION = 1400;
    const HOLD2 = 1000;
    const EXPLODE = 900;

    const animar = (ahora: number) => {
      if (completadoRef.current) return;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      const dt = ahora - faseInicio;

      if (fase === "assembling") {
        let todasLlegaron = true;
        for (const p of particulas) {
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          p.x += dx * 0.08;
          p.y += dy * 0.08;
          if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) todasLlegaron = false;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.alpha})`;
          ctx.fill();
        }
        if (todasLlegaron || dt > 2500) {
          fase = "hold1";
          faseInicio = ahora;
        }
      } else if (fase === "hold1") {
        for (const p of particulas) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.alpha})`;
          ctx.fill();
        }
        if (dt >= HOLD1) {
          fase = "transitioning";
          faseInicio = ahora;
          const total = Math.max(particulas.length, puntosN.length);
          while (particulas.length < total) {
            particulas.push({
              x: Math.random() * W,
              y: Math.random() * H,
              tx: 0,
              ty: 0,
              vx: 0,
              vy: 0,
              alpha: 0,
              r: 52,
              g: 211,
              b: 153,
              size: Math.random() * 1.5 + 0.8,
              exploding: false,
              evx: 0,
              evy: 0,
            });
          }
          for (let i = 0; i < particulas.length; i++) {
            const pn = puntosN[i % puntosN.length];
            particulas[i].tx = pn.x;
            particulas[i].ty = pn.y;
            particulas[i].r = 52;
            particulas[i].g = 211;
            particulas[i].b = 153;
            if (i >= puntosN.length) {
              particulas[i].alpha = 0;
              particulas[i].x = Math.random() * W;
              particulas[i].y = Math.random() * H;
            }
          }
        }
      } else if (fase === "transitioning") {
        const prog = Math.min(dt / TRANSITION, 1);
        let todasLlegaron = true;
        for (let i = 0; i < puntosN.length; i++) {
          const p = particulas[i];
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          p.x += dx * 0.07;
          p.y += dy * 0.07;
          p.alpha = Math.min(1, p.alpha + 0.04);
          if (Math.abs(dx) > 0.8 || Math.abs(dy) > 0.8) todasLlegaron = false;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.alpha})`;
          ctx.fill();
        }
        for (let i = puntosN.length; i < particulas.length; i++) {
          const p = particulas[i];
          p.alpha = Math.max(0, p.alpha - 0.04);
        }
        if ((todasLlegaron && prog > 0.5) || prog >= 1) {
          particulas.splice(puntosN.length);
          fase = "hold2";
          faseInicio = ahora;
        }
      } else if (fase === "hold2") {
        for (const p of particulas) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.alpha})`;
          ctx.fill();
        }
        if (dt >= HOLD2) {
          fase = "exploding";
          faseInicio = ahora;
          for (const p of particulas) {
            const angulo = Math.atan2(p.y - H / 2, p.x - W / 2);
            const vel = Math.random() * 6 + 2;
            p.evx = Math.cos(angulo) * vel + (Math.random() - 0.5) * 3;
            p.evy = Math.sin(angulo) * vel + (Math.random() - 0.5) * 3;
          }
        }
      } else if (fase === "exploding") {
        const prog = dt / EXPLODE;
        let todasFueraOAlfa = true;
        for (const p of particulas) {
          p.x += p.evx;
          p.y += p.evy;
          p.evx *= 0.97;
          p.evy *= 0.97;
          p.alpha = Math.max(0, 1 - prog * 1.3);
          if (p.alpha > 0) todasFueraOAlfa = false;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.alpha})`;
          ctx.fill();
        }
        if (todasFueraOAlfa || prog >= 1) {
          fase = "done";
          llamarComplete();
          return;
        }
      }

      rafRef.current = requestAnimationFrame(animar);
    };

    rafRef.current = requestAnimationFrame(animar);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [nombre, llamarComplete]);

  return (
    <canvas
      ref={canvasRef}
      onClick={llamarComplete}
      className="fixed inset-0 z-50 cursor-pointer bg-black"
      aria-label="Pantalla de bienvenida — toca para saltar"
    />
  );
}
