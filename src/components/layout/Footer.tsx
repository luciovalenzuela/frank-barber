import { fullAddress, instagramLink, mapLink, navigation, site, whatsappLink } from "@/content/site";
import { Logo } from "@/components/ui/Logo";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";

export function Footer() {
  return (
    <footer className="border-t border-line bg-coal">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-sand">{site.tagline}</p>
          <div className="mt-6 flex gap-3">
            <a
              href={instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Frank Barber"
              className="inline-flex size-11 items-center justify-center rounded-full border border-line text-xl text-cream transition-colors hover:border-gold hover:text-gold"
            >
              <InstagramIcon />
            </a>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp de Frank Barber"
              className="inline-flex size-11 items-center justify-center rounded-full border border-line text-xl text-cream transition-colors hover:border-gold hover:text-gold"
            >
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        <nav aria-label="Pie de página">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Secciones</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-cream/80 transition-colors hover:text-gold">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Contacto</h2>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            <li>
              <a href={mapLink} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-gold">
                {fullAddress}
              </a>
            </li>
            <li>
              <a href={`tel:${site.contact.phoneHref}`} className="transition-colors hover:text-gold">
                {site.contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.contact.email}`} className="transition-colors hover:text-gold">
                {site.contact.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-6 text-xs text-sand">
          © {site.name}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
