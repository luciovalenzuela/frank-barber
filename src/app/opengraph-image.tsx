import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

// Imagen que se muestra al compartir el link (WhatsApp, Instagram, etc.).
// Para usar una foto real, borrar este archivo y agregar `opengraph-image.jpg`
// (1200×630) en esta misma carpeta.

export const alt = `${site.name} · Barbería`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// La misma tipografía de los títulos del sitio (acá hace falta el archivo .ttf).
// Se lee una sola vez, al generar la imagen durante el build.
const displayFont = await readFile(join(process.cwd(), "assets/fonts/DMSerifDisplay-Regular.ttf"));

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
          fontFamily: "DM Serif Display",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 14, color: "#c8a04a", textTransform: "uppercase" }}>
          {`Barbería en ${site.location.locality}`}
        </div>
        <div style={{ fontSize: 170, lineHeight: 1, marginTop: 28 }}>{site.name}</div>
        <div style={{ fontSize: 40, marginTop: 36, color: "#a99b86" }}>{site.tagline}</div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "DM Serif Display", data: displayFont, style: "normal", weight: 400 }],
    },
  );
}
