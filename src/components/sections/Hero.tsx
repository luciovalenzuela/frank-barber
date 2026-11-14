import Image from "next/image";
import { bookingLink, hero, site, whatsappLink } from "@/content/site";
import { ButtonLink } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";

export function Hero() {
  return (
    <section id="inicio" className="relative isolate flex min-h-svh items-center overflow-hidden">
      {/* Fondo: foto real si está configurada, si no un degradado cuero + franjas. */}
      <div className="absolute inset-0 -z-10">
        {hero.image ? (
          <Image src={hero.image} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="barber-stripes absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,#6b442355,transparent_60%),linear-gradient(160deg,#24180f,#0c0a08_65%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 pt-28 pb-20">
        <div className="fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-gold">{hero.eyebrow}</p>
        </div>
        <div className="fade-up [animation-delay:120ms]">
          <h1 className="mt-5 font-display text-6xl leading-[0.95] text-cream sm:text-8xl lg:text-9xl">
            {site.name}
          </h1>
        </div>
        <div className="fade-up [animation-delay:240ms]">
          <p className="mt-6 max-w-md text-lg leading-relaxed text-cream/80 sm:text-xl">{site.tagline}</p>
        </div>
        <div className="fade-up mt-10 flex flex-col gap-3 [animation-delay:360ms] sm:flex-row">
          <ButtonLink href={bookingLink}>Reservar turno</ButtonLink>
          <ButtonLink href={whatsappLink()} variant="outline">
            <WhatsAppIcon className="text-lg" />
            WhatsApp
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
