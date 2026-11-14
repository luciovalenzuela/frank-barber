import type { NextRequest } from "next/server";
import { getAvailability } from "@/server/booking";
import { isDatabaseConfigured } from "@/server/db/client";

/** GET /api/disponibilidad?servicio=corte → días, horarios libres y barberos disponibles en cada uno. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const headers = { "Cache-Control": "no-store" };

  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Las reservas online no están disponibles." }, { status: 503, headers });
  }

  try {
    const days = await getAvailability(params.get("servicio") ?? "");
    if (!days) {
      return Response.json({ error: "Servicio inválido." }, { status: 400, headers });
    }
    return Response.json({ days }, { headers });
  } catch (error) {
    console.error("[disponibilidad]", error);
    return Response.json({ error: "No pudimos cargar los horarios." }, { status: 500, headers });
  }
}
