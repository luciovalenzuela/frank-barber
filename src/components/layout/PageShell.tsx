import Link from "next/link";
import type { ReactNode } from "react";
import { fullAddress, site, whatsappLink } from "@/content/site";
import { Logo } from "@/components/ui/Logo";

/** Marco de las páginas internas (reservar, mi turno): header mínimo y pie con contacto. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-line bg-ink">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/" aria-label={`${site.name}, ir al inicio`}>
            <Logo />
          </Link>
          <Link href="/" className="text-sm font-medium text-cream/80 transition-colors hover:text-gold">
            Volver al sitio
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">{children}</main>

      <footer className="border-t border-line bg-coal">
        <p className="mx-auto max-w-3xl px-5 py-6 text-xs leading-relaxed text-sand">
          {site.name} · {fullAddress} ·{" "}
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cream/80 underline-offset-4 hover:text-gold hover:underline"
          >
            WhatsApp {site.contact.phoneDisplay}
          </a>
        </p>
      </footer>
    </div>
  );
}
