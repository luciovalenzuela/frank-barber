import { bookingLink, services, servicesExtras } from "@/content/site";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Services() {
  return (
    <section id="servicios" className="bg-coal py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Servicios"
          title="Lo que hacemos"
          description="Cada servicio incluye asesoramiento. Elegí el tuyo y reservá online en un minuto."
        />

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <li key={service.name}>
              <Reveal delay={(index % 3) * 100} className="h-full">
                <article
                  className={`flex h-full flex-col rounded-lg border p-6 transition-colors duration-300 hover:border-gold/70 ${
                    service.badge ? "border-gold/60 bg-leather" : "border-line bg-ink"
                  }`}
                >
                  {service.badge ? (
                    <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.3em] text-gold">
                      {service.badge}
                    </p>
                  ) : null}
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-2xl text-cream">{service.name}</h3>
                    <p className="shrink-0 text-lg font-bold text-gold tabular-nums">{service.price}</p>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-sand">{service.description}</p>
                  <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-cream/60">
                    {service.duration}
                  </p>
                </article>
              </Reveal>
            </li>
          ))}

          <li>
            <Reveal delay={(services.length % 3) * 100} className="h-full">
              <div className="barber-stripes flex h-full flex-col justify-center rounded-lg border border-dashed border-line p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gold">{servicesExtras.title}</h3>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-cream/85">
                  {servicesExtras.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span aria-hidden="true" className="text-gold">
                        —
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </li>
        </ul>

        <Reveal className="mt-12 text-center">
          <ButtonLink href={bookingLink}>Reservar turno</ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}
