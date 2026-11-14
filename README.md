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

El cliente reserva en `/reservar`: elige servicio, barbero (o "sin preferencia"), día y
horario, y deja nombre, email y teléfono. El turno se guarda en la base, recibe un mail
de confirmación y un link personal (`/turno/…`) para verlo o cancelarlo.

- **Servicios, precios, duraciones, barberos y horarios** se editan en `src/content/site.ts`
  (`services`, `barbers` y `booking`). No cambiar los `id`: quedan guardados en cada turno.
- **Reglas** (en `booking`): turnos cada 30 min, hasta 21 días para adelante, con 60 min
  de anticipación mínima y hasta 3 turnos futuros por email.
- **Sin turnos pisados:** además de calcular los horarios libres, la base rechaza dos
  turnos confirmados del mismo barbero que se superpongan.
- **Pendiente:** hoy todos los barberos atienden todo el horario del local. Faltan
  francos, vacaciones y horarios propios, y el panel para que la barbería vea la agenda.

### En local

No hay que configurar nada: `npm run dev` usa una base de prueba guardada en `.data/`
y, en vez de enviar mails, los guarda como archivos en `.data/outbox/`. Para empezar de
cero, borrar la carpeta `.data/`.

### Puesta en producción (una sola vez)

1. **Base de datos.** Crear un proyecto en [Supabase](https://supabase.com). En
   **Connect**, copiar la cadena de **Transaction pooler** (puerto 6543).
2. **Tablas.** Copiar `.env.example` como `.env.local`, pegar esa cadena en
   `DATABASE_URL` y correr `npm run db:migrate`.
3. **Mails.** Crear una cuenta en [Resend](https://resend.com), verificar el dominio
   propio y generar una API key.
4. **Variables en Vercel** (Settings → Environment Variables): `DATABASE_URL`,
   `RESEND_API_KEY`, `EMAIL_FROM` y, si se quiere, `BOOKING_NOTIFY_EMAIL`.
5. **Redeploy** y probar una reserva real en `/reservar`.
6. **Activar.** Cuando esté probado, agregar `NEXT_PUBLIC_ONLINE_BOOKING=1` y volver a
   deployar: recién ahí los botones "Reservar turno" dejan de ir a AgendaPro.

Mientras `DATABASE_URL` no esté cargada en Vercel, `/reservar` muestra los links a
AgendaPro y WhatsApp.

Los turnos se pueden ver en Supabase → Table Editor → `appointments`.

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
