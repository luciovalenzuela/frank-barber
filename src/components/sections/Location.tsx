import { fullAddress, mapEmbedUrl, mapLink, openingHours, site } from "@/content/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ClockIcon, PinIcon } from "@/components/ui/icons";

export function Location() {
  return (
    <section id="horarios" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading eyebrow="Horarios y ubicación" title="Pasá a vernos" />

        <div className="mt-14 grid gap-8 lg:grid-cols-5">
          <Reveal className="space-y-8 lg:col-span-2">
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-gold">
                <ClockIcon className="text-base" />
                Horarios
              </h3>
              <table className="mt-4 w-full text-sm">
                <tbody>
                  {openingHours.map((row) => (
                    <tr key={row.days} className="border-b border-line">
                      <th scope="row" className="py-3 pr-4 text-left font-medium text-cream">
                        {row.days}
                      </th>
                      <td className={`py-3 text-right tabular-nums ${row.hours ? "text-cream/80" : "text-sand/70"}`}>
                        {row.hours ?? "Cerrado"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-gold">
                <PinIcon className="text-base" />
                Dirección
              </h3>
              <address className="mt-4 text-base not-italic leading-relaxed text-cream">
                {site.location.address}
                <br />
                <span className="text-cream/80">{site.location.city}</span>
                {site.location.note ? (
                  <>
                    <br />
                    <span className="text-sm text-sand">{site.location.note}</span>
                  </>
                ) : null}
              </address>
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-semibold text-gold underline-offset-4 hover:underline"
              >
                Cómo llegar
              </a>
            </div>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-3">
            <div className="h-80 overflow-hidden rounded-lg border border-line bg-leather lg:h-full lg:min-h-96">
              <iframe
                title={`Mapa: ${fullAddress}`}
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="size-full border-0 grayscale-[0.6] contrast-[1.1]"
                allowFullScreen
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
