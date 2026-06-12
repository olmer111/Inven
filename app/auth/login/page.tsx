"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Barcode, CircleNotch } from "@phosphor-icons/react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError(
        "Supabase no está configurado. En local: copia .env.local.example a .env.local. En Vercel: añade las variables en Settings → Environment Variables y redespliega."
      );
      return;
    }
    setEnviando(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : error.message
      );
      setEnviando(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-5 py-12">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
      >
        <Barcode size={24} weight="bold" className="text-emerald-600" />
        StockScan
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Iniciar sesión
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Accede a tu inventario.
        </p>

        <form onSubmit={entrar} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="h-11 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-medium text-white transition duration-150 ease-out hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.98]"
          >
            {enviando && <CircleNotch size={16} className="animate-spin" />}
            Entrar
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-zinc-500">
        ¿No tienes cuenta?{" "}
        <Link
          href="/auth/register"
          className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
        >
          Crear cuenta gratis
        </Link>
      </p>
    </div>
  );
}
