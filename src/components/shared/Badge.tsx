const VARIANTS: Record<string, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/15 text-primary border-primary/30",
};

interface BadgeProps {
  label: string;
  variant?: keyof typeof VARIANTS;
  /** Optional accessible label override; defaults to `label`. Use when the
   *  visible text is abbreviated and a fuller description aids AT users. */
  "aria-label"?: string;
}

export function Badge({ label, variant = "muted", "aria-label": ariaLabel }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${VARIANTS[variant] || VARIANTS.muted}`}
      aria-label={ariaLabel}
    >
      {label}
    </span>
  );
}
