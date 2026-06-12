"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleNotch, Check } from "@phosphor-icons/react";
import { supabase, isSupabaseConfigured, PLANES, type Plan } from "@/lib/supabase";

function esPlan(valor: string | null): valor is Plan {
  return valor === "gratuito" || valor === "pro" || valor === "max";
}

function FormularioRegistro() {
  const router = useRouter();
  const params = useSearchParams();
  const planInicial = params.get("plan");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<Plan>(
    esPlan(planInicial) ? planInicial : "gratuito"
  );
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [registrado, setRegistrado] = useState(false);

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError(
        "Supabase no está configurado. En local: copia .env.local.example a .env.local. En Vercel: añade las variables en Settings → Environment Variables y redespliega."
      );
      return;
    }
    if (password.length < 6) {
      setError("La contraseña necesita al menos 6 caracteres.");
      return;
    }
    setEnviando(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { plan } },
    });
    if (error) {
      setError(error.message);
      setEnviando(false);
      return;
    }
    if (data.session) {
      router.push("/dashboard");
    } else {
      setRegistrado(true);
      setEnviando(false);
    }
  };

  if (registrado) {
    return (
      <div className="w-full max-w-sm space-y-5 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/10">
          <Check size={28} weight="bold" className="text-emerald-600" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Revisa tu correo
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Te hemos enviado un enlace para confirmar la cuenta. Después podrás
            iniciar sesión.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="inline-block rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition duration-150 ease-out hover:bg-emerald-700 active:scale-[0.98]"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Crear cuenta
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Elige un plan y empieza a escanear. Sin tarjeta en el plan Gratuito.
        </p>
      </div>

      <form onSubmit={registrar} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Plan
          </legend>
          {(Object.keys(PLANES) as Plan[]).map((clave) => {
            const p = PLANES[clave];
            const activo = plan === clave;
            return (
              <label
                key={clave}
                className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                  activo
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-600/10 ring-2 ring-emerald-500/20"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="plan"
                    value={clave}
                    checked={activo}
                    onChange={() => setPlan(clave)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      activo
                        ? "border-emerald-600 bg-emerald-600"
                        : "border-zinc-300 dark:border-zinc-600"
                    }`}
                  >
                    {activo && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {p.nombre}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {p.limite === null ? "Ilimitado" : `${p.limite} productos`}
                  </span>
                </span>
                <span className="font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                  {p.precio}
                  {clave !== "gratuito" && (
                    <span className="text-xs text-zinc-400">/mes</span>
                  )}
                </span>
              </label>
            );
          })}
          {plan !== "gratuito" && (
            <p className="text-xs text-zinc-500">
              El cobro con Stripe aún no está activo: tendrás el plan asignado
              sin cargo durante la beta.
            </p>
          )}
        </fieldset>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
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
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
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
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
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
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-semibold text-white transition duration-150 ease-out hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.98]"
        >
          {enviando && <CircleNotch size={16} className="animate-spin" />}
          Crear cuenta
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <FormularioRegistro />
    </Suspense>
  );
}
