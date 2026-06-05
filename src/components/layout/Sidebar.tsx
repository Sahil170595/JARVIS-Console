"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/config/navigation";
import { ConnectionBadge } from "./ConnectionBadge";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed left-0 top-0 bottom-0 w-16 bg-card border-r border-border flex flex-col items-center py-4 z-50"
    >
      <div className="mb-6">
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"
        >
          <span className="text-primary font-display font-bold text-sm">J</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }
              `}
            >
              <Icon size={20} aria-hidden="true" />
            </Link>
          );
        })}
      </div>

      <ConnectionBadge />
    </nav>
  );
}
