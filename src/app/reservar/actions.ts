"use server";

import { redirect } from "next/navigation";
import { cancelAppointment, createBooking } from "@/server/booking";
import { isDatabaseConfigured } from "@/server/db/client";

export type ActionError = { code: string; message: string };

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

/** Crea el turno y lleva a su página. Si algo falla, devuelve el error para mostrarlo en el formulario. */
export async function bookAppointment(formData: FormData): Promise<ActionError> {
  if (!isDatabaseConfigured()) {
    return { code: "error", message: "Las reservas online no están disponibles en este momento." };
  }

  let token: string;
  try {
    const result = await createBooking({
      serviceId: field(formData, "servicio"),
      barberId: field(formData, "barbero"),
      date: field(formData, "fecha"),
      time: field(formData, "hora"),
      name: field(formData, "nombre"),
      email: field(formData, "email"),
      phone: field(formData, "telefono"),
    });
    if (!result.ok) return { code: result.code, message: result.message };
    token = result.token;
  } catch (error) {
    console.error("[reservar]", error);
    return { code: "error", message: "No pudimos guardar el turno. Probá de nuevo en un momento." };
  }

  redirect(`/turno/${token}?nuevo=1`);
}

export async function cancelAppointmentAction(formData: FormData) {
  const token = field(formData, "token");
  let failed = false;
  try {
    const result = await cancelAppointment(token);
    failed = !result.ok;
  } catch (error) {
    console.error("[cancelar]", error);
    failed = true;
  }

  redirect(`/turno/${encodeURIComponent(token)}${failed ? "?error=1" : ""}`);
}
