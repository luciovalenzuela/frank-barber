import Image from "next/image";
import { site } from "@/content/site";
import logo from "../../../public/images/logo-fb.png";

/** Logo real de la barbería: monograma "FB · Haircut and Shave", en crema sobre transparente. */
export function Logo({ className = "h-9 w-auto", priority = false }: { className?: string; priority?: boolean }) {
  return <Image src={logo} alt={site.name} className={className} priority={priority} sizes="(min-width: 1024px) 480px, 384px" />;
}
