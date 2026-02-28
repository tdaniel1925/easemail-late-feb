"use client";

import {
  Mail,
  Calendar,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  HelpCircle
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AccountSwitcher } from "@/components/mail/AccountSwitcher";
import { FolderTree } from "@/components/mail/FolderTree";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// Bottom navigation items (Calendar, Teams, Contacts, CRM)
const bottomNavItems = [
  { id: "calendar", icon: Calendar, label: "Calendar", href: "/calendar" },
  { id: "teams", icon: MessageSquare, label: "Teams", href: "/teams", badge: 2 },
  { id: "contacts", icon: Users, label: "Contacts", href: "/contacts" },
  { id: "crm", icon: BarChart3, label: "CRM", href: "/crm" },
];

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  if (collapsed) {
    return (
      <aside className="flex w-12 flex-shrink-0 flex-col border-r border-border-default bg-surface-secondary py-3">
        {/* Spacer to push bottom nav to bottom */}
        <div className="flex-1" />

        {/* Bottom navigation icons */}
        <div className="flex flex-col items-center gap-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                  active
                    ? 'bg-surface-tertiary'
                    : 'hover:bg-surface-tertiary'
                }`}
                aria-label={item.label}
              >
                <Icon
                  size={18}
                  className={active ? 'text-accent' : 'text-text-secondary'}
                  strokeWidth={1.5}
                />
              </Link>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-border-default bg-surface-secondary transition-[width] duration-200 ease-out-expo">
      {/* Account switcher */}
      <AccountSwitcher />

      {/* Folder tree - scrollable area */}
      <nav className="flex-1 overflow-y-auto px-2">
        <FolderTree />
      </nav>

      {/* Bottom navigation - Calendar, Teams, Contacts, CRM */}
      <div className="border-t border-border-subtle px-2 py-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
                active
                  ? 'bg-surface-tertiary'
                  : 'hover:bg-surface-tertiary'
              }`}
            >
              <Icon
                size={15}
                className={active ? 'text-accent' : 'text-text-tertiary'}
                strokeWidth={1.5}
              />
              <span
                className={`text-xs ${
                  active ? 'font-medium text-text-primary' : 'text-text-secondary'
                }`}
              >
                {item.label}
              </span>
              {item.badge && (
                <span className="ml-auto text-xs font-semibold text-text-primary">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Settings & Help */}
      <div className="border-t border-border-subtle px-2 py-2 pb-3">
        <Link
          href="/settings"
          className={`mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
            isActive('/settings') ? 'bg-surface-tertiary' : 'hover:bg-surface-tertiary'
          }`}
        >
          <Settings size={15} className={isActive('/settings') ? 'text-accent' : 'text-text-tertiary'} strokeWidth={1.5} />
          <span className={`text-xs ${isActive('/settings') ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>Settings</span>
        </Link>
        <Link
          href="/help"
          className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
            isActive('/help') ? 'bg-surface-tertiary' : 'hover:bg-surface-tertiary'
          }`}
        >
          <HelpCircle size={15} className={isActive('/help') ? 'text-accent' : 'text-text-tertiary'} strokeWidth={1.5} />
          <span className={`text-xs ${isActive('/help') ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>Help</span>
        </Link>
      </div>
    </aside>
  );
}
