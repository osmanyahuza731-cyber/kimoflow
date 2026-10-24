import { cn } from "@/lib/utils";

/** KIMO GRAPHYX "KG." mark — purple K-chevron and G with orange dots, drawn as a vector. */
export function BrandMark({ className, title = "KIMO GRAPHYX" }: { className?: string | undefined; title?: string }) {
  return (
    <svg viewBox="0 0 64 48" className={cn("h-8 w-auto", className)} role="img" aria-label={title}>
      <title>{title}</title>
      <circle cx="9" cy="8" r="5" className="fill-primary" />
      <path d="M22 12 L10 25 L22 38" fill="none" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-brand-purple" />
      <path
        d="M51 16.5 A13 13 0 1 0 51.8 30 L51.8 25.5 L41 25.5"
        fill="none"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-brand-purple"
      />
      <circle cx="59" cy="38" r="3.6" className="fill-primary" />
    </svg>
  );
}

/** Mark + "KIMO GRAPHYX / YOUR BEST CHOICE" lockup used in navigation and documents. */
export function BrandLockup({ className, compact = false }: { className?: string | undefined; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className={compact ? "h-7" : "h-9"} />
      <div className="leading-tight">
        <p className={cn("font-display font-bold tracking-wide", compact ? "text-sm" : "text-base")}>KIMO GRAPHYX</p>
        <p className={cn("font-display font-semibold tracking-[0.14em] text-primary", compact ? "text-[10px]" : "text-[11px]")}>
          YOUR BEST CHOICE
        </p>
      </div>
    </div>
  );
}
