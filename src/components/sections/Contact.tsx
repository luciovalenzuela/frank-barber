import type { ReactNode } from "react";
import { bookingLink, instagramLink, site, whatsappLink } from "@/content/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CalendarIcon, InstagramIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { ContactForm } from "./ContactForm";

type Channel = { label: string; value: string; href: string; icon: ReactNode };

const channels: Channel[] = [
  { label: "Turnos online", value: "Reservá en AgendaPro", href: bookingLink, icon: <CalendarIcon /> },
  { label: "WhatsApp", value: "Escribinos", href: whatsappLink(), icon: <WhatsAppIcon /> },
  {
    label: "Teléfono",
    value: site.contact.phoneDisplay,
    href: `tel:${site.contact.phoneHref}`,
    icon: <PhoneIcon />,
  },
  {
    label: "Instagram",
    value: `@${site.contact.instagramUser}`,
    href: instagramLink,
    icon: <InstagramIcon />,
  },
];

export function Contact() {
  return (
    <section id="contacto" className="bg-coal py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Contacto"
          title="Hablemos"
          description="Para turnos, lo más rápido es reservar online. Para cualquier otra consulta, escribinos."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-5">
          <ul className="space-y-4 lg:col-span-2">
            {channels.map((channel, index) => {
              const external = channel.href.startsWith("http");
              return (
                <li key={channel.label}>
                  <Reveal delay={index * 100}>
                    <a
                      href={channel.href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="group flex items-center gap-4 rounded-lg border border-line bg-ink p-5 transition-colors hover:border-gold/70"
                    >
                      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-leather text-2xl text-gold">
                        {channel.icon}
                      </span>
                      <span>
                        <span className="block text-xs font-bold uppercase tracking-[0.25em] text-sand">
                          {channel.label}
                        </span>
                        <span className="mt-1 block text-base font-medium text-cream transition-colors group-hover:text-gold">
                          {channel.value}
                        </span>
                      </span>
                    </a>
                  </Reveal>
                </li>
              );
            })}
          </ul>

          <Reveal delay={120} className="lg:col-span-3">
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
