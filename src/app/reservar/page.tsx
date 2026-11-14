import type { Metadata } from "next";
import { barbers, services, site, whatsappLink } from "@/content/site";
import { BookingForm } from "@/components/booking/BookingForm";
import { PageShell } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { isDatabaseConfigured } from "@/server/db/client";

export const metadata: Metadata = {
  title: "Reservar turno",
  description: `Reservá tu turno en ${site.name}: elegí servicio, barbero, día y horario.`,
  alternates: { canonical: "/reservar" },
};

export default function ReservarPage() {
  return (
    <PageShell>
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-gold">Turnos</p>
      <h1 className="mt-3 font-display text-4xl text-cream sm:text-5xl">Reservá tu turno</h1>
      <p className="mt-3 text-sand">{site.promise}</p>

      {isDatabaseConfigured() ? (
        <div className="mt-10">
          <BookingForm services={services} barbers={barbers.map(({ id, name, role }) => ({ id, name, role }))} />
        </div>
      ) : (
        // Mientras la base de datos no esté configurada en producción, se ofrece lo que ya funciona.
        <div className="mt-6">
          <p className="max-w-xl leading-relaxed text-sand">
            Estamos terminando de preparar las reservas desde esta página. Mientras tanto, podés reservar por
            nuestros canales de siempre.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={site.bookingUrl}>Reservar en AgendaPro</ButtonLink>
            <ButtonLink href={whatsappLink()} variant="outline">
              Escribir por WhatsApp
            </ButtonLink>
          </div>
        </div>
      )}
    </PageShell>
  );
}
