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
}

export function Badge({ label, variant = "muted" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${VARIANTS[variant] || VARIANTS.muted}`}
    >
      {label}
    </span>
  );
}
