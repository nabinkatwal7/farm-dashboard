import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
};

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <tr>
      <td colSpan={99}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          {Icon && <Icon size={32} className="text-muted" style={{ opacity: 0.5 }} />}
          <div>
            <div className="text-primary" style={{ fontWeight: 600, marginBottom: 4 }}>
              {title}
            </div>
            {description && (
              <div className="text-muted" style={{ fontSize: "0.85rem", maxWidth: 400, lineHeight: 1.5 }}>
                {description}
              </div>
            )}
          </div>
          {action && (
            <Link
              href={action.href}
              className="btn-primary"
              style={{ textDecoration: "none", marginTop: 4 }}
            >
              {action.label}
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}
