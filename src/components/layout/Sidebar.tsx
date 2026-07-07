'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCheck, Kanban, Handshake, Bot, Mail, CalendarDays,
  ChevronRight, Package, FileText, Receipt, CreditCard, BarChart2,
  Building2, CheckSquare, FolderOpen, MessageSquare, Megaphone, ShieldCheck, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_SECTIONS = [
  {
    label: 'CRM',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/leads', label: 'Leads', icon: Users },
      { href: '/customers', label: 'Customers', icon: UserCheck },
      { href: '/pipeline', label: 'Pipeline', icon: Kanban },
      { href: '/deals', label: 'Deals', icon: Handshake },
    ],
  },
  {
    label: 'Productivity',
    items: [
      { href: '/ai', label: 'AI Assistant', icon: Bot },
      { href: '/email', label: 'Email', icon: Mail },
      { href: '/calendar', label: 'Calendar', icon: CalendarDays },
      { href: '/tasks', label: 'Tasks', icon: CheckSquare },
      { href: '/documents', label: 'Documents', icon: FolderOpen },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/products', label: 'Products', icon: Package },
      { href: '/quotations', label: 'Quotations', icon: FileText },
      { href: '/invoices', label: 'Invoices', icon: Receipt },
      { href: '/payments', label: 'Payments', icon: CreditCard },
      { href: '/reports', label: 'Reports', icon: BarChart2 },
    ],
  },
  {
    label: 'Team & Marketing',
    items: [
      { href: '/team', label: 'Team', icon: Building2 },
      { href: '/communication', label: 'Communication', icon: MessageSquare },
      { href: '/marketing', label: 'Marketing', icon: Megaphone },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin', label: 'Admin Panel', icon: ShieldCheck },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <ChevronRight className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
          SalesPilot
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-3">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">SalesPilot CRM v4.0</p>
      </div>
    </aside>
  );
}
