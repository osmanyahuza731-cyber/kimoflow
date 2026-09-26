import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { ToneKey } from "@/lib/workflow";

const TONE_CLASS: Record<ToneKey, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-info/10 text-info border-info/25",
  warning: "bg-warning/15 text-warning-foreground border-warning/35",
  success: "bg-success/12 text-success border-success/30",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  accent: "bg-accent/15 text-accent-foreground border-accent/35",
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: ToneKey;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-xl font-semibold sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-display text-sm font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <p className="font-display text-sm font-semibold">{title}</p>
      {message ? <p className="max-w-sm text-sm text-muted-foreground">{message}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function LoadingRow({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </div>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  tone = "neutral",
  to,
  search,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  tone?: ToneKey;
  to?: string;
  search?: Record<string, string>;
}) {
  const body = (
    <>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "tabular mt-1 block font-display text-xl font-semibold",
          tone === "danger" && "text-destructive",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning-foreground",
        )}
      >
        {value}
      </span>
      {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
    </>
  );

  const className =
    "block border-b border-r border-border px-4 py-3 last:border-r-0 transition-colors hover:bg-muted/60";

  if (to) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <Link to={to as any} search={search as any} className={className}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

export function TableShell({ children, className }: ComponentProps<"div">) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="data-grid">{children}</table>
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap border-b border-border bg-muted/60 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td className={cn("border-b border-border px-3 py-2 align-middle", className)} {...props} />
  );
}
