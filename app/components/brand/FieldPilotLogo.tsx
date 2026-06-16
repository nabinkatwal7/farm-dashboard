type FieldPilotLogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  size?: "sm" | "md";
  showTagline?: boolean;
};

const sizeClasses = {
  sm: {
    shell: "gap-2.5",
    icon: "h-9 w-9",
    wordmark: "text-base",
    tagline: "text-[0.68rem]",
    svg: 22,
  },
  md: {
    shell: "gap-3",
    icon: "h-10 w-10",
    wordmark: "text-lg",
    tagline: "text-xs",
    svg: 24,
  },
} as const;

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function FieldPilotLogo({
  className,
  iconClassName,
  textClassName,
  size = "md",
  showTagline = true,
}: FieldPilotLogoProps) {
  const config = sizeClasses[size];

  return (
    <span className={cn("inline-flex items-center", config.shell, className)}>
      <span
        className={cn(
          "grid place-items-center rounded-xl border border-border bg-card text-green",
          config.icon,
          iconClassName,
        )}
      >
        <svg
          width={config.svg}
          height={config.svg}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <rect x="6" y="6" width="36" height="36" rx="12" fill="currentColor" fillOpacity="0.12" />
          <path
            d="M13 28c3.1-2.6 6.8-3.9 11-3.9 4 0 7.4 1 10.2 3"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M13 34c3.2-2 6.8-3 10.8-3 4.2 0 7.9 1 11.2 3"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M24 12v14"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M24 15c0-2.8 2.2-5 5-5-0.3 3-2.2 5.2-5 6.2"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 18.5c0-2.3-1.8-4-4-4 0.2 2.5 1.7 4.2 4 5"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className={cn("min-w-0", textClassName)}>
        <span className={cn("block font-extrabold leading-none text-primary", config.wordmark)}>
          FieldPilot
        </span>
        {showTagline ? (
          <span className={cn("block font-medium text-muted", config.tagline)}>
            Grown with clarity
          </span>
        ) : null}
      </span>
    </span>
  );
}
