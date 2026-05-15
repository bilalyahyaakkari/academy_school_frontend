import {
  LayoutDashboard,
  Users,
  UsersRound,
  Wallet,
  Shirt,
  Settings,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

export type NavItem = {
  href: string;
  labelKey: TranslationKey;
  icon: typeof LayoutDashboard;
};

export const NAV_SECTIONS: { labelKey: TranslationKey; items: NavItem[] }[] = [
  {
    labelKey: "nav.section.overview",
    items: [
      { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "nav.section.management",
    items: [
      { href: "/students", labelKey: "nav.students", icon: Users },
      { href: "/groups", labelKey: "nav.groups", icon: UsersRound },
      { href: "/payments", labelKey: "nav.payments", icon: Wallet },
      { href: "/uniforms", labelKey: "nav.uniforms", icon: Shirt },
    ],
  },
  {
    labelKey: "nav.section.system",
    items: [{ href: "/settings", labelKey: "nav.settings", icon: Settings }],
  },
];
