import {
  MessageSquare,
  Activity,
  Brain,
  Wrench,
  GitBranch,
  Calendar,
  Settings,
  Scale,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Chat", path: "/chat", icon: MessageSquare },
  // P109.1 — Debate viewer (replaces the retired Tauri chimera/ui/ app).
  { label: "Debate", path: "/debate", icon: Scale },
  { label: "Control Room", path: "/control-room", icon: Activity },
  { label: "Memory", path: "/memory", icon: Brain },
  { label: "Tools", path: "/tools", icon: Wrench },
  { label: "Workflows", path: "/workflows", icon: GitBranch },
  { label: "Calendar", path: "/calendar", icon: Calendar },
  { label: "Settings", path: "/settings", icon: Settings },
];
