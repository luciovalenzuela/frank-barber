import { Reveal } from "./Reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({ eyebrow, title, description, align = "center" }: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <Reveal className={`max-w-2xl ${centered ? "mx-auto text-center" : ""}`}>
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-gold">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl leading-tight text-balance text-cream sm:text-5xl">
        {title}
      </h2>
      {description ? <p className="mt-4 text-base leading-relaxed text-sand">{description}</p> : null}
    </Reveal>
  );
}
