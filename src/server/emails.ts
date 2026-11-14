import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { booking, formatPrice, fullAddress, mapLink, site, siteUrl } from "@/content/site";
import type { Appointment } from "./booking";

/**
 * Envío de mails. Se elige el primer medio configurado:
 *
 * 1. Gmail (o cualquier SMTP): SMTP_USER y SMTP_PASS. Para Gmail, SMTP_PASS es
 *    una "contraseña de aplicación" (no la contraseña de la cuenta). Sirve sin
 *    dominio propio; Gmail permite unos 500 mails por día.
 *    SMTP_HOST y SMTP_PORT son opcionales (por defecto, los de Gmail).
 * 2. Resend: RESEND_API_KEY. Necesita un dominio propio verificado en Resend.
 *
 * EMAIL_FROM: remitente que ve el cliente. Con Gmail, tiene que ser la misma
 * casilla: "Frank Barber <frankbarber.turnos@gmail.com>". Si falta, se usa
 * SMTP_USER con el nombre de la barbería.
 *
 * BOOKING_NOTIFY_EMAIL (opcional): casilla de la barbería que recibe un aviso
 * por cada turno nuevo o cancelado.
 *
 * Sin nada configurado: en desarrollo los mails se guardan en .data/outbox;
 * en producción no se envían (queda registrado en los logs).
 */

type Email = { to: string; subject: string; html: string; replyTo?: string };

/** ¿Hay algún medio de envío configurado? */
export function isEmailConfigured() {
  return Boolean((process.env.SMTP_USER && process.env.SMTP_PASS) || process.env.RESEND_API_KEY);
}

function sender() {
  return process.env.EMAIL_FROM || (process.env.SMTP_USER ? `${site.name} <${process.env.SMTP_USER}>` : "");
}

async function sendWithSmtp(email: Email) {
  const { createTransport } = await import("nodemailer");
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: sender(),
    to: email.to,
    subject: email.subject,
    html: email.html,
    replyTo: email.replyTo,
  });
}

async function sendWithResend(email: Email) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: sender(),
      to: email.to,
      subject: email.subject,
      html: email.html,
      reply_to: email.replyTo,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend respondió ${response.status}: ${await response.text()}`);
  }
}

async function send(email: Email) {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return sendWithSmtp(email);
  if (process.env.RESEND_API_KEY) return sendWithResend(email);

  if (process.env.NODE_ENV === "production") {
    console.error(`[mail] No hay medio de envío configurado: no se envió "${email.subject}".`);
    return;
  }
  const dir = join(process.cwd(), ".data/outbox");
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${Date.now()}-${email.subject.replace(/[^\p{L}\d]+/gu, "-").slice(0, 60)}.html`);
  await writeFile(file, `<!-- Para: ${email.to} | Asunto: ${email.subject} -->\n${email.html}`);
  console.log(`[mail] Sin medio de envío configurado: guardado en ${file}`);
}

/** Un mail que falla no tiene que hacer fallar la reserva: se registra y se sigue. */
async function sendSafely(email: Email) {
  try {
    await send(email);
  } catch (error) {
    console.error(`[mail] No se pudo enviar "${email.subject}" a ${email.to}:`, error);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDay(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: booking.timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: booking.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function appointmentUrl(appointment: Appointment) {
  return `${siteUrl}/turno/${appointment.token}`;
}

function detailRows(appointment: Appointment, extra: [string, string][] = []) {
  const rows: [string, string][] = [
    ["Día", formatDay(appointment.startsAt)],
    ["Hora", `${formatTime(appointment.startsAt)} hs`],
    ["Servicio", appointment.serviceName],
    ["Barbero", appointment.barberName],
    ["Precio", formatPrice(appointment.priceArs)],
    ...extra,
  ];
  return rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#8a7d6b;">${label}</td><td style="padding:6px 0;color:#1a1410;font-weight:600;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
}

function layout(title: string, body: string) {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f4efe6;font-family:Helvetica,Arial,sans-serif;color:#1a1410;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
      <div style="background:#0c0a08;padding:24px 28px;">
        <span style="font-family:Georgia,serif;font-size:24px;color:#f1e8d8;">Frank</span>
        <span style="font-size:11px;letter-spacing:4px;color:#c8a04a;text-transform:uppercase;">&nbsp;Barber</span>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:24px;font-weight:normal;">${title}</h1>
        ${body}
      </div>
      <div style="padding:16px 28px;background:#faf7f1;font-size:12px;color:#8a7d6b;">
        ${escapeHtml(site.name)} · ${escapeHtml(fullAddress)} · ${escapeHtml(site.contact.phoneDisplay)}
      </div>
    </div>
  </body>
</html>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#c8a04a;color:#0c0a08;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;">${label}</a>`;
}

export async function sendBookingEmails(appointment: Appointment) {
  const firstName = escapeHtml(appointment.clientName.split(" ")[0]);
  const url = appointmentUrl(appointment);
  const when = `${formatDay(appointment.startsAt)} a las ${formatTime(appointment.startsAt)}`;

  await sendSafely({
    to: appointment.clientEmail,
    subject: `Tu turno en ${site.name}: ${when}`,
    html: layout(
      "Tu turno está confirmado",
      `<p style="margin:0 0 16px;line-height:1.5;">Hola ${firstName}, te esperamos en ${escapeHtml(site.name)}.</p>
       <table style="border-collapse:collapse;margin:0 0 20px;font-size:15px;">${detailRows(appointment)}</table>
       <p style="margin:0 0 20px;line-height:1.5;">
         <a href="${mapLink}" style="color:#8a6a1f;">${escapeHtml(fullAddress)}</a>
       </p>
       <p style="margin:0 0 20px;">${button(url, "Ver mi turno")}</p>
       <p style="margin:0;font-size:13px;line-height:1.5;color:#8a7d6b;">
         Si no podés venir, cancelá desde ese mismo link así liberamos el horario.
       </p>`,
    ),
  });

  const notify = process.env.BOOKING_NOTIFY_EMAIL;
  if (notify) {
    await sendSafely({
      to: notify,
      replyTo: appointment.clientEmail,
      subject: `Turno nuevo: ${appointment.clientName}, ${when}`,
      html: layout(
        "Turno nuevo",
        `<table style="border-collapse:collapse;font-size:15px;">${detailRows(appointment, [
          ["Cliente", appointment.clientName],
          ["Teléfono", appointment.clientPhone],
          ["Email", appointment.clientEmail],
        ])}</table>`,
      ),
    });
  }
}

export async function sendCancellationEmails(appointment: Appointment) {
  const firstName = escapeHtml(appointment.clientName.split(" ")[0]);
  const when = `${formatDay(appointment.startsAt)} a las ${formatTime(appointment.startsAt)}`;

  await sendSafely({
    to: appointment.clientEmail,
    subject: `Cancelaste tu turno en ${site.name}`,
    html: layout(
      "Turno cancelado",
      `<p style="margin:0 0 16px;line-height:1.5;">Hola ${firstName}, cancelamos tu turno del ${escapeHtml(when)}.</p>
       <p style="margin:0 0 20px;line-height:1.5;">Cuando quieras, podés reservar otro.</p>
       <p style="margin:0;">${button(`${siteUrl}/reservar`, "Reservar otro turno")}</p>`,
    ),
  });

  const notify = process.env.BOOKING_NOTIFY_EMAIL;
  if (notify) {
    await sendSafely({
      to: notify,
      subject: `Turno cancelado: ${appointment.clientName}, ${when}`,
      html: layout(
        "Turno cancelado",
        `<table style="border-collapse:collapse;font-size:15px;">${detailRows(appointment, [
          ["Cliente", appointment.clientName],
          ["Teléfono", appointment.clientPhone],
        ])}</table>`,
      ),
    });
  }
}
