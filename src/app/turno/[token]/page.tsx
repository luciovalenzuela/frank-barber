import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { cancelAppointmentAction } from "@/app/reservar/actions";
import { formatPrice, fullAddress, mapLink, site, whatsappLink } from "@/content/site";
import { PageShell } from "@/components/layout/PageShell";
import { ButtonLink, buttonClasses } from "@/components/ui/Button";
import { getAppointment, hasStarted, type Appointment } from "@/server/booking";
import { isDatabaseConfigured } from "@/server/db/client";
import { formatDay, formatTime } from "@/server/emails";

export const metadata: Metadata = {
  title: "Tu turno",
  // El link es personal: no tiene que aparecer en buscadores.
  robots: { index: false, follow: false },
};

type Props = PageProps<"/turno/[token]">;

export default function TurnoPage({ params, searchParams }: Props) {
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl">
        <Suspense fallback={<p className="text-sand">Buscando tu turno…</p>}>
          <AppointmentView params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </PageShell>
  );
}

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-gold">{eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl text-cream sm:text-5xl">{title}</h1>
    </>
  );
}

/** Link para agregar el turno a Google Calendar. */
function calendarLink(appointment: Appointment) {
  const stamp = (date: Date) => date.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: `${appointment.serviceName} en ${site.name}`,
    dates: `${stamp(appointment.startsAt)}/${stamp(appointment.endsAt)}`,
    details: `Con ${appointment.barberName}.`,
    location: fullAddress,
  });
  return `https://calendar.google.com/calendar/render?${query}`;
}

async function AppointmentView({ params, searchParams }: Props) {
  // El estado del turno depende de la hora actual: se resuelve en cada visita, nunca en el build.
  await connection();
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const appointment = isDatabaseConfigured() ? await getAppointment(token) : null;

  if (!appointment) {
    return (
      <>
        <Heading eyebrow="Turnos" title="No encontramos ese turno" />
        <p className="mt-6 max-w-xl leading-relaxed text-sand">
          Revisá que el link esté completo. Si el problema sigue, escribinos por WhatsApp y lo vemos.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/reservar">Reservar un turno</ButtonLink>
          <ButtonLink href={whatsappLink()} variant="outline">
            WhatsApp
          </ButtonLink>
        </div>
      </>
    );
  }

  const cancelled = appointment.status === "cancelled";
  const past = hasStarted(appointment);
  const justBooked = query.nuevo === "1" && !cancelled && !past;

  const details: [string, string][] = [
    ["Día", formatDay(appointment.startsAt)],
    ["Hora", `${formatTime(appointment.startsAt)} hs`],
    ["Servicio", appointment.serviceName],
    ["Barbero", appointment.barberName],
    ["Precio", formatPrice(appointment.priceArs)],
    ["A nombre de", appointment.clientName],
  ];

  return (
    <>
      <Heading
        eyebrow={cancelled ? "Turno cancelado" : past ? "Turno pasado" : "Turno confirmado"}
        title={
          cancelled
            ? "Este turno fue cancelado"
            : past
              ? "Este turno ya pasó"
              : justBooked
                ? "¡Listo! Te esperamos"
                : "Tu turno"
        }
      />

      {justBooked ? (
        <p className="mt-5 max-w-xl leading-relaxed text-sand">
          Te mandamos la confirmación a <span className="text-cream">{appointment.clientEmail}</span>. Si no la ves,
          revisá el correo no deseado.
        </p>
      ) : null}

      {query.error === "1" ? (
        <p role="alert" className="mt-6 rounded-md border border-red-400/50 bg-red-950/40 p-3 text-sm text-red-100">
          No pudimos cancelar el turno. Probá de nuevo o escribinos por WhatsApp.
        </p>
      ) : null}

      <dl className={`mt-8 rounded-lg border border-line bg-coal p-6 ${cancelled ? "opacity-60" : ""}`}>
        {details.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-6 border-b border-line/60 py-3 last:border-0">
            <dt className="text-sm text-sand">{label}</dt>
            <dd className={`text-right font-medium text-cream first-letter:uppercase ${cancelled ? "line-through" : ""}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {cancelled || past ? (
        <div className="mt-8">
          <ButtonLink href="/reservar">Reservar otro turno</ButtonLink>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm leading-relaxed text-sand">
            <a href={mapLink} target="_blank" rel="noopener noreferrer" className="text-gold underline-offset-4 hover:underline">
              {fullAddress}
            </a>
          </p>
          <div className="mt-6">
            <ButtonLink href={calendarLink(appointment)} variant="outline">
              Agregar a Google Calendar
            </ButtonLink>
          </div>

          <details className="mt-12 border-t border-line pt-6">
            <summary className="cursor-pointer text-sm font-semibold text-cream/80 hover:text-gold">
              No puedo ir: cancelar el turno
            </summary>
            <form action={cancelAppointmentAction} className="mt-4">
              <input type="hidden" name="token" value={appointment.token} />
              <p className="text-sm leading-relaxed text-sand">
                Al cancelar se libera el horario para otra persona. No se puede deshacer, pero podés reservar de nuevo
                cuando quieras.
              </p>
              <button type="submit" className={buttonClasses("outline", "mt-4 cursor-pointer")}>
                Sí, cancelar mi turno
              </button>
            </form>
          </details>
        </>
      )}
    </>
  );
}
