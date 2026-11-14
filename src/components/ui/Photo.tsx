import Image from "next/image";
import { ScissorsIcon } from "./icons";

type PhotoProps = {
  /** Ruta dentro de /public. Si falta, se dibuja un placeholder. */
  src?: string;
  alt: string;
  /** Valor de `sizes` para next/image según el ancho que ocupa en la grilla. */
  sizes?: string;
  className?: string;
};

/**
 * Foto que llena a su contenedor. Mientras no haya imagen real muestra un
 * placeholder, así el layout no cambia cuando se suben las fotos definitivas.
 */
export function Photo({ src, alt, sizes = "(min-width: 768px) 25vw, 50vw", className = "" }: PhotoProps) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-leather ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        <div
          role="img"
          aria-label={`${alt} (foto pendiente)`}
          className="barber-stripes absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-saddle/40 via-leather to-coal p-3 text-center"
        >
          <ScissorsIcon className="text-2xl text-gold/60" />
          <span className="text-xs font-medium tracking-wide text-sand">{alt}</span>
        </div>
      )}
    </div>
  );
}
