'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Droplets, LayoutDashboard, Banknote, Tractor, Users, UserCog, Package,
  FlaskConical, ClipboardList, BarChart3, Settings, Store, Wallet,
  Menu, X, LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn, bnDateFull, todayStr } from '@/lib/utils';
import { PageLoader } from '@/components/ui';

const ADMIN_NAV = [
  { href: '/dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { href: '/collections', label: 'দুধ সংগ্রহ', icon: Droplets },
  { href: '/sales', label: 'বিক্রি', icon: Banknote },
  { href: '/farms', label: 'ফার্ম', icon: Tractor },
  { href: '/customers', label: 'কাস্টমার', icon: Users },
  { href: '/employees', label: 'কর্মচারী', icon: UserCog },
  { href: '/products', label: 'পণ্য', icon: Package },
  { href: '/production', label: 'উৎপাদন', icon: FlaskConical },
  { href: '/orders', label: 'অর্ডার', icon: ClipboardList },
  { href: '/reports', label: 'রিপোর্ট', icon: BarChart3 },
  { href: '/settings', label: 'সেটিংস', icon: Settings },
];

const CUSTOMER_NAV = [
  { href: '/shop', label: 'দোকান', icon: Store },
  { href: '/my-orders', label: 'আমার অর্ডার', icon: ClipboardList },
  { href: '/account', label: 'আমার হিসাব', icon: Wallet },
];

// Pages an employee (কর্মচারী) is blocked from: products, employees, settings, farms (rates/payments).
const EMPLOYEE_HIDDEN = new Set(['/products', '/employees', '/settings', '/farms']);
const ROLE_LABEL = { admin: 'মালিক', employee: 'কর্মচারী', customer: 'কাস্টমার' };

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ghee-400 text-leaf-900 shadow-sm">
        <Droplets className="h-5 w-5" />
      </span>
      <div>
        <p className="font-display text-lg leading-tight text-white">সফেদ ডেইরি</p>
        <p className="text-[11px] text-leaf-200/70">খাঁটি দুধের হিসাব</p>
      </div>
    </div>
  );
}

function NavLinks({ nav, onNavigate }) {
  const pathname = usePathname();
  return (
    <nav className="mt-6 flex flex-col gap-1">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-leaf-700/80 text-white shadow-sm'
                : 'text-leaf-100/70 hover:bg-leaf-800/70 hover:text-white'
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Shell({ nav, roles, children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const allowed = !!user && roles.includes(user.role);

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace('/login');
    }
  }, [loading, allowed, router]);

  if (loading || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <PageLoader />
      </div>
    );
  }

  // employees see a trimmed admin nav
  const visibleNav =
    user.role === 'employee' ? nav.filter((n) => !EMPLOYEE_HIDDEN.has(n.href)) : nav;

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const sidebarInner = (onNavigate) => (
    <div className="flex h-full flex-col p-4">
      <Brand />
      <NavLinks nav={visibleNav} onNavigate={onNavigate} />
      <div className="mt-auto rounded-xl bg-leaf-800/60 p-3">
        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        <p className="truncate text-xs text-leaf-200/70">
          {user.phone} · {ROLE_LABEL[user.role] || ''}
        </p>
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-leaf-900/70 px-3 py-2 text-xs font-medium text-leaf-100 hover:bg-leaf-900"
        >
          <LogOut className="h-3.5 w-3.5" />
          লগ আউট
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 bg-leaf-900 lg:block">
        {sidebarInner()}
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-leaf-900/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-leaf-900 shadow-lift">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-leaf-200 hover:bg-leaf-800"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarInner(() => setOpen(false))}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* topbar */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-leaf-100 bg-canvas/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-leaf-800 hover:bg-leaf-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-sm text-stone-500">{bnDateFull(todayStr())}</p>
          </div>
          <div className="hidden items-center gap-2 text-sm text-stone-600 sm:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-leaf-100 font-semibold text-leaf-800">
              {user.name?.[0] || '?'}
            </span>
            {user.name}
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminShell({ children }) {
  return (
    <Shell nav={ADMIN_NAV} roles={['admin', 'employee']}>
      {children}
    </Shell>
  );
}

export function CustomerShell({ children }) {
  return (
    <Shell nav={CUSTOMER_NAV} roles={['customer']}>
      {children}
    </Shell>
  );
}
