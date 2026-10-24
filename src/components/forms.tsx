import { useState, type ComponentProps, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const inputCls =
  "h-9 w-full rounded-sm border border-input bg-surface px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60";

export function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string | undefined;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1 text-sm", className)}>
      <span className="font-medium">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cn(inputCls, "pr-7", className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={3} {...props} className={cn(inputCls, "h-auto py-2", className)} />;
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  accent: "bg-brand-purple text-brand-purple-foreground hover:bg-brand-purple/90",
  secondary: "border border-border bg-surface hover:bg-muted",
  ghost: "hover:bg-muted",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

export function Btn({
  variant = "primary",
  loading,
  className,
  children,
  size = "md",
  ...props
}: ComponentProps<"button"> & { variant?: BtnVariant; loading?: boolean; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-55",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
        BTN[variant],
        className,
      )}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[92vh] overflow-y-auto", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}

/** Confirmation dialog for dangerous actions, with optional mandatory reason. */
export function ConfirmAction({
  trigger,
  title,
  message,
  confirmLabel = "Confirm",
  requireReason,
  danger,
  onConfirm,
}: {
  trigger: (open: () => void) => ReactNode;
  title: string;
  message: string;
  confirmLabel?: string;
  requireReason?: boolean;
  danger?: boolean;
  onConfirm: (reason: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      {trigger(() => setOpen(true))}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={message}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn
              variant={danger ? "danger" : "primary"}
              loading={busy}
              disabled={requireReason && !reason.trim()}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm(reason.trim());
                  setOpen(false);
                  setReason("");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {confirmLabel}
            </Btn>
          </>
        }
      >
        {requireReason ? (
          <Field label="Reason" required>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        ) : null}
      </Modal>
    </>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            value === t.value
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
