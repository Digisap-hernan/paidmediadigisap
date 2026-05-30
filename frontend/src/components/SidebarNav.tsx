'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/clients', label: 'Clientes' },
  { href: '/campaigns', label: 'Campañas' },
  { href: '/incidents', label: 'Incidentes' },
  { href: '/settings', label: 'Settings' },
];

export default function SidebarNav() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white">
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="text-xs uppercase tracking-wider text-slate-500">Digisap</div>
        <div className="text-base font-semibold text-slate-900">Paid Media Ops</div>
      </div>
      <nav className="p-3 space-y-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm transition ${
                active
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
