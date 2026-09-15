export interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

// Central nav definition shared by the desktop sidebar and mobile tab bar.
export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "▦", end: true },
  { to: "/metrics", label: "Metrics", icon: "◎" },
  { to: "/log", label: "Log Entry", icon: "✎" },
  { to: "/dashboards", label: "Dashboards", icon: "▤" },
  { to: "/profile", label: "Profile", icon: "✦" },
];

export const ADMIN_NAV_ITEM: NavItem = { to: "/admin", label: "Admin", icon: "⚙" };
