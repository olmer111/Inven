"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { obtenerNombreDisplay, guardarNombreDisplay } from "@/lib/perfiles";
import PantallaParticulas from "@/components/PantallaParticulas";

type Estado = "cargando" | "setup" | "animacion";

export default function WelcomePage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [userId, setUserId] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [inputNombre, setInputNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!activo) return;
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      setUserId(user.id);
      const nombreGuardado = await obtenerNombreDisplay(user.id);
      if (!activo) return;
      if (nombreGuardado) {
        setNombre(nombreGuardado);
        setEstado("animacion");
      } else {
        setEstado("setup");
      }
    })();
    return () => { activo = false; };
  }, [router]);

  const confirmarNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputNombre.trim();
    if (!val) {
      setError("Escribe cómo quieres que te llame.");
      return;
    }
    setGuardando(true);
    setError(null);
    await guardarNombreDisplay(userId, val);
    setNombre(val);
    setEstado("animacion");
  };

  if (estado === "cargando") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <CircleNotch size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (estado === "setup") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-6">
        <div className="w-full max-w-xs space-y-6 text-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              ¡Bienvenido a Inven!
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              ¿Cómo quieres que te llame?
            </p>
          </div>
          <form onSubmit={confirmarNombre} className="space-y-4">
            <input
              type="text"
              autoFocus
              value={inputNombre}
              onChange={(e) => setInputNombre(e.target.value)}
              placeholder="Tu nombre"
              maxLength={40}
              className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-center text-sm font-medium text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
            />
            {error && (
              <p role="alert" className="text-xs text-red-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={guardando}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-semibold text-white transition duration-150 ease-out hover:bg-emerald-500 disabled:opacity-50 active:scale-[0.98]"
            >
              {guardando && <CircleNotch size={16} className="animate-spin" />}
              Continuar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <PantallaParticulas
      nombre={nombre}
      onComplete={() => router.replace("/dashboard")}
    />
  );
}
