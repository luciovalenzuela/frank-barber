"use client";

import { useEffect, useState } from "react";
import { bookingLink, navigation } from "@/content/site";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || menuOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        solid ? "border-line bg-ink/95 backdrop-blur" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-20">
        <a href="#inicio" aria-label="Frank Barber, ir al inicio" onClick={() => setMenuOpen(false)}>
          <Logo priority className="h-9 w-auto sm:h-11" />
        </a>

        <nav aria-label="Principal" className="hidden items-center gap-8 lg:flex">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-cream/80 transition-colors hover:text-gold"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink
            href={bookingLink}
            aria-label="Reservar turno"
            className="px-4 py-2 text-xs whitespace-nowrap sm:px-6 sm:py-3 sm:text-sm"
          >
            Reservar<span className="max-[399px]:hidden">turno</span>
          </ButtonLink>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full text-2xl text-cream lg:hidden"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav id="menu-mobile" aria-label="Principal" className="border-t border-line px-5 pb-6 lg:hidden">
          <ul>
            {navigation.map((item) => (
              <li key={item.href} className="border-b border-line/60">
                <a
                  href={item.href}
                  className="block py-4 font-display text-2xl text-cream"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
