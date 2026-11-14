import { ImageResponse } from "next/og";
import { site } from "@/content/site";

// Imagen que se muestra al compartir el link (WhatsApp, Instagram, etc.).
// Para usar una foto real, borrar este archivo y agregar `opengraph-image.jpg`
// (1200×630) en esta misma carpeta.

export const alt = `${site.name} · Barbería`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #24180f, #0c0a08 65%)",
          color: "#f1e8d8",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 14, color: "#c8a04a", textTransform: "uppercase" }}>
          Barbería
        </div>
        <div style={{ fontSize: 150, marginTop: 20 }}>{site.name}</div>
        <div style={{ fontSize: 38, marginTop: 20, color: "#a99b86" }}>{site.tagline}</div>
      </div>
    ),
    size,
  );
}
