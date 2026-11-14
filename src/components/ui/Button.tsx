import type { AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] transition-colors duration-200";

const variants: Record<Variant, string> = {
  primary: "bg-gold text-ink hover:bg-gold-soft",
  outline: "border border-cream/30 text-cream hover:border-gold hover:text-gold",
};

export function buttonClasses(variant: Variant = "primary", className = "") {
  return `${base} ${variants[variant]} ${className}`;
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  children: ReactNode;
};

/** Link con apariencia de botón. Los links externos abren en pestaña nueva. */
export function ButtonLink({ variant, className, href = "", children, ...props }: ButtonLinkProps) {
  const external = href.startsWith("http");

  return (
    <a
      href={href}
      className={buttonClasses(variant, className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
    </a>
  );
}
