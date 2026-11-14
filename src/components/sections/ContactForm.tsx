"use client";

import type { FormEvent } from "react";
import { site, whatsappLink } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { MailIcon, WhatsAppIcon } from "@/components/ui/icons";

const fieldClasses =
  "mt-2 w-full rounded-md border border-line bg-ink px-4 py-3 text-base text-cream placeholder:text-sand/50 focus:border-gold focus:outline-none";

/**
 * Formulario sin backend: arma el mensaje y lo abre en WhatsApp o en el
 * cliente de correo del visitante, según el botón que elija.
 */
export function ContactForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const name = String(data.get("nombre") ?? "").trim();
    const phone = String(data.get("telefono") ?? "").trim();
    const message = String(data.get("mensaje") ?? "").trim();

    const text = [`Hola, soy ${name}.`, message, phone ? `Mi teléfono: ${phone}` : ""]
      .filter(Boolean)
      .join("\n");

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;

    if (submitter?.value === "email") {
      const subject = encodeURIComponent(`Consulta de ${name}`);
      window.location.href = `mailto:${site.contact.email}?subject=${subject}&body=${encodeURIComponent(text)}`;
    } else {
      window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-coal p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-cream">
          Nombre
          <input name="nombre" type="text" required autoComplete="name" className={fieldClasses} />
        </label>
        <label className="block text-sm font-medium text-cream">
          Teléfono <span className="font-normal text-sand">(opcional)</span>
          <input name="telefono" type="tel" autoComplete="tel" className={fieldClasses} />
        </label>
      </div>
      <label className="mt-5 block text-sm font-medium text-cream">
        Mensaje
        <textarea
          name="mensaje"
          required
          rows={4}
          placeholder="Contanos qué necesitás"
          className={`${fieldClasses} resize-y`}
        />
      </label>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="submit" name="via" value="whatsapp" className={buttonClasses("primary", "cursor-pointer")}>
          <WhatsAppIcon className="text-lg" />
          Enviar por WhatsApp
        </button>
        <button type="submit" name="via" value="email" className={buttonClasses("outline", "cursor-pointer")}>
          <MailIcon className="text-lg" />
          Enviar por email
        </button>
      </div>
    </form>
  );
}
