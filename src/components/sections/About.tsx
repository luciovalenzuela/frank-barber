import { about } from "@/content/site";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPublicCatalog } from "@/server/catalog";

export async function About() {
  const { barbers } = await getPublicCatalog();
  return (
    <section id="nosotros" className="bg-coal py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading eyebrow="Nosotros" title={about.title} align="left" />
            <Reveal delay={100} className="mt-6 space-y-4 text-base leading-relaxed text-sand">
              {about.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </Reveal>
          </div>

          <ul className="grid content-center gap-4">
            {about.highlights.map((item, index) => (
              <li key={item.value}>
                <Reveal delay={index * 100}>
                  <div className="flex items-baseline gap-5 border-b border-line pb-4">
                    <p className="w-32 shrink-0 font-display text-2xl text-gold sm:w-40 sm:text-3xl">
                      {item.value}
                    </p>
                    <p className="text-sm text-cream/80">{item.label}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        <h3 className="mt-20 text-xs font-bold uppercase tracking-[0.35em] text-gold">El equipo</h3>
        <ul className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {barbers.map((barber, index) => (
            <li key={barber.id}>
              <Reveal delay={index * 100}>
                <Photo
                  src={barber.photo}
                  alt={`Foto de ${barber.name}`}
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="aspect-[4/5]"
                />
                <p className="mt-4 font-display text-xl text-cream sm:text-2xl">{barber.name}</p>
                <p className="text-sm text-sand">{barber.role}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
