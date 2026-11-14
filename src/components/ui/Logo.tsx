import { site } from "@/content/site";

/** Logotipo tipográfico. Cuando haya un logo real, reemplazar por un <Image />. */
export function Logo({ className = "" }: { className?: string }) {
  const [first, ...rest] = site.name.split(" ");

  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="font-display text-2xl leading-none text-cream">{first}</span>
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-gold">
        {rest.join(" ")}
      </span>
    </span>
  );
}
