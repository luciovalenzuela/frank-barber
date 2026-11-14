# Frank Barber — sitio web

Landing de una sola página para la barbería Frank Barber.

- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS v4
- **Hosting:** Vercel, conectado a un repo de GitHub
- **Landing estática** + **sistema de turnos propio** (en `/reservar`) con base de datos Postgres y mails de confirmación.

## Requisitos

- Node.js 22 (LTS). Con nvm: `nvm install 22 && nvm use 22`.

## Correr en local

```bash
npm install     # solo la primera vez, o cuando cambian las dependencias
npm run dev     # http://localhost:3000
```

Otros comandos:

| Comando         | Qué hace                                             |
| --------------- | ---------------------------------------------------- |
| `npm run lint`  | Revisa el código con ESLint                          |
| `npm run build` | Genera el build de producción (lo mismo que Vercel)  |
| `npm run start` | Sirve el build de producción en local                |
| `npm test`      | Corre los tests (horarios disponibles y reglas de la base) |
| `npm run db:migrate` | Crea o actualiza las tablas en la base de producción |

## Dónde se edita cada cosa

```
src/
├── app/
│   ├── layout.tsx            # <html>, tipografías, meta tags, Open Graph, JSON-LD
│   ├── page.tsx              # Orden de las secciones de la landing
│   ├── globals.css           # Paleta, tipografías y animaciones
│   ├── opengraph-image.tsx   # Imagen que aparece al compartir el link
│   ├── icon.svg              # Favicon
│   ├── robots.ts / sitemap.ts
│   ├── reservar/             # Página de reserva y acciones (reservar, cancelar)
│   ├── turno/[token]/        # "Mi turno": ver, agregar al calendario, cancelar
│   └── api/disponibilidad/   # Horarios libres (lo consulta el formulario)
├── components/
│   ├── layout/               # Header, Footer y marco de las páginas internas
│   ├── sections/             # Hero, Services, Gallery, About, Location, Contact
│   ├── booking/              # Formulario de reserva
│   └── ui/                   # Piezas reutilizables (botón, foto, íconos, Reveal…)
├── content/
│   └── site.ts               # ← TODO el contenido: textos, precios, horarios, contacto
├── lib/booking/              # Cálculo de horarios libres (con tests)
└── server/                   # Reservas, mails y conexión a la base
db/migrations/                # Tablas de la base (SQL)
public/
└── images/                   # Fotos del sitio
```

### Contenido pendiente

Todos los textos y datos están en [`src/content/site.ts`](src/content/site.ts).
Contacto, dirección, servicios, precios, horarios y equipo salen del perfil público de
la barbería en AgendaPro y Google Maps (noviembre 2026). **Cuando cambien los precios
en AgendaPro hay que actualizarlos también acá**: no se sincronizan solos.

Lo que falta está marcado con `COMPLETAR`:

- Email de contacto (mientras sea `null`, no se muestra)
- Fotos: hero, galería y equipo
- Revisar la frase del hero y el texto de "Nosotros"

"Reservar turno" lleva a la página de reservas de AgendaPro (`bookingUrl`).

### Fotos

1. Copiar las imágenes a `public/images/` (JPG o WebP, idealmente de no más de ~2000 px de ancho).
2. En `src/content/site.ts`, completar la ruta:
   - Galería: `{ src: "/images/galeria-1.jpg", alt: "Corte degradado", tall: true }`
   - Equipo: `{ name: "Frank", role: "Fundador y barbero", photo: "/images/frank.jpg" }`
   - Hero: `image: "/images/hero.jpg"`

Mientras una foto no tenga `src`, se muestra un placeholder con el mismo tamaño.
Next.js optimiza las imágenes automáticamente (tamaños y formatos modernos).

### Colores y tipografías

- Paleta: bloque `@theme` en `src/app/globals.css` (`ink`, `coal`, `leather`, `saddle`, `gold`, `cream`, `sand`).
- Tipografías: `src/app/layout.tsx` (DM Serif Display para títulos, Manrope para texto).

## Turnos online

El cliente reserva en `/reservar` en cuatro pasos: servicio, día y hora, barbero (o "sin
preferencia") y sus datos. El turno se guarda en la base, recibe un mail de confirmación
y un link personal (`/turno/…`) para verlo o cancelarlo. Los botones "Reservar turno" del
sitio llevan ahí; con `NEXT_PUBLIC_ONLINE_BOOKING=0` vuelven a llevar a AgendaPro.

### La base de datos (Supabase)

| Tabla | Qué guarda |
| ----- | ---------- |
| `services` | Servicios: nombre, descripción, qué incluye, precio, duración, orden, activo |
| `barbers` | Barberos: nombre, nombre completo, rol, foto, orden, activo |
| `barber_hours` | Horario de cada barbero por día (0 = domingo … 6 = sábado). Sin fila = franco |
| `clients` | Clientes, identificados por email |
| `appointments` | Turnos: cliente, barbero, servicio, precio, inicio, fin, estado |

**Precios, servicios, barberos y francos se cambian desde Supabase → Table Editor**, sin
tocar el código. El sitio toma los cambios en pocos minutos. Para sacar un servicio o un
barbero, poner `active` en `false` (no borrarlo: queda en el historial de turnos). No
cambiar los `id`.

Cada turno guarda el nombre y el precio del servicio al momento de reservar, así el
historial no cambia cuando se actualizan los precios. La base rechaza dos turnos
confirmados del mismo barbero que se superpongan.

Las tablas se crean con `npm run db:migrate` (lee `DATABASE_URL` de `.env.local`). Los
cambios de estructura van como archivos nuevos en `db/migrations/`.

Los valores de `services`, `barbers` y `booking.weeklyHours` en `src/content/site.ts` son
de respaldo: solo se usan si la base no está configurada.

**Reglas** (en `booking`, `src/content/site.ts`): turnos cada 30 min, hasta 21 días para
adelante, con 60 min de anticipación mínima y hasta 3 turnos futuros por email.

### Mails

Se manda un mail al cliente al reservar y al cancelar (y, si se configura
`BOOKING_NOTIFY_EMAIL`, un aviso a la barbería).

- **Sin dominio propio (ahora):** una cuenta de Gmail de la barbería. En Google: activar
  la verificación en dos pasos y crear una contraseña de aplicación en
  <https://myaccount.google.com/apppasswords>. Cargar `SMTP_USER` (la casilla) y
  `SMTP_PASS` (la contraseña de aplicación, sin espacios).
- **Con dominio propio (más adelante):** cambiar a una casilla del dominio, o a Resend
  (`RESEND_API_KEY` y `EMAIL_FROM`), y borrar `SMTP_USER`/`SMTP_PASS`. No hay que tocar
  el código: solo las variables en Vercel y un redeploy.

### En local

`npm run dev` usa la base de `DATABASE_URL` si está en `.env.local`; si no, una base de
prueba en `.data/`. Sin medio de envío configurado, los mails se guardan como archivos en
`.data/outbox/`.

### Variables en Vercel (Settings → Environment Variables)

`DATABASE_URL`, `SMTP_USER`, `SMTP_PASS` y, si se quiere, `EMAIL_FROM` y
`BOOKING_NOTIFY_EMAIL`. Después de cargarlas o cambiarlas, hacer **Redeploy**. Mientras
falte `DATABASE_URL`, `/reservar` muestra los links a AgendaPro y WhatsApp.

Los turnos se ven en Supabase → Table Editor → `appointments`.

## Deploy

El sitio se publica en Vercel. Una vez conectado el repo (ver abajo), **cada push a
`main` se publica solo** en producción, y cada rama o pull request genera una URL de
preview.

Flujo para publicar cambios:

```bash
git add .
git commit -m "Describir el cambio"
git push
```

A los ~60 segundos el cambio está online. El estado de cada deploy se ve en el
dashboard de Vercel.

### Configuración inicial (una sola vez)

**1. Crear el repo en GitHub y subir el código**

1. Entrar a <https://github.com/new>.
2. Nombre: `frank-barber`. Elegir Private o Public. **No** marcar "Add a README",
   `.gitignore` ni licencia (el repo tiene que quedar vacío).
3. Crear el repo y, desde la carpeta del proyecto, correr (reemplazando `USUARIO`):

```bash
git remote add origin https://github.com/USUARIO/frank-barber.git
git push -u origin main
```

**2. Conectar el repo a Vercel**

1. Entrar a <https://vercel.com/new>.
2. En "Import Git Repository", elegir `frank-barber`. Si no aparece, usar "Adjust
   GitHub App Permissions" para darle acceso a Vercel a ese repo.
3. Vercel detecta Next.js solo: dejar todo por defecto y tocar **Deploy**.
4. Al terminar, el sitio queda en una URL del tipo `https://frank-barber.vercel.app`.

**3. Dominio propio (opcional)**

En Vercel: Project → Settings → Domains → agregar el dominio y seguir las
instrucciones de DNS. Las URLs de SEO (canonical, Open Graph, sitemap) toman el
dominio de producción automáticamente; para forzar otro, definir la variable de
entorno `NEXT_PUBLIC_SITE_URL` (ej. `https://frankbarber.com.ar`) en
Settings → Environment Variables y volver a deployar.
