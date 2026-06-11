# StockScan

App de inventario por escaneo: apunta la cámara al código de barras o QR de
cualquier producto, se busca automáticamente en
[Open Food Facts](https://world.openfoodfacts.org) y se guarda en tu
inventario personal.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS v4 · Supabase · Motion

## Planes

| Plan     | Precio     | Límite                                   |
| -------- | ---------- | ---------------------------------------- |
| Gratuito | €0         | 30 productos                             |
| Pro      | €9.99/mes  | 500 productos + exportar CSV             |
| Max      | €24.99/mes | Ilimitado + multi-usuario + estadísticas |

## Páginas

- `/` — Landing con hero, features y precios
- `/auth/register` — Registro con selección de plan
- `/auth/login` — Inicio de sesión
- `/dashboard` — Inventario del usuario (requiere login)
- `/demo` — Dashboard con datos de ejemplo, sin cuenta

## Puesta en marcha

```bash
npm install
cp .env.local.example .env.local   # rellena con tus claves de Supabase
npm run dev
```

En Supabase:

1. Crea un proyecto y copia la URL y la anon key a `.env.local`.
2. Ejecuta `lib/database.sql` en el SQL Editor (tablas, RLS y el trigger que
   crea el perfil con el plan elegido al registrarse).

Sin `.env.local` la app compila y `/demo` funciona; login y dashboard
redirigen o muestran un aviso de configuración.

## Estructura

```
app/page.tsx                        Landing
app/auth/login/page.tsx             Login
app/auth/register/page.tsx          Registro + selección de plan
app/dashboard/page.tsx              App principal (CRUD real)
app/demo/page.tsx                   Demo con estado local
components/Scanner.tsx              Escáner de cámara (html5-qrcode)
components/ProductoCard.tsx         Tarjeta de producto
components/ModalAgregarProducto.tsx Escanear → confirmar → guardar
components/Inventario.tsx           Vista compartida dashboard/demo
lib/supabase.ts                     Cliente, tipos y planes
lib/productos.ts                    CRUD, Open Food Facts, CSV
lib/database.sql                    Schema + RLS + trigger
```

## Pendiente

- [ ] Conectar Stripe para cobros reales de Pro y Max
- [ ] Desplegar en Vercel
