import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/settings", label: "Configurações" },
  { href: "/admin/logs", label: "Logs" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <aside className="hidden shrink-0 border-r border-slate-200 bg-white md:flex md:w-56 md:flex-col">
        <div className="border-b border-slate-200 px-4 py-4">
          <span className="text-sm font-semibold text-slate-800">Fast EPS · Painel</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3 text-sm text-slate-600">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-brand-700">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/api/admin/auth/logout" method="POST" className="border-t border-slate-200 p-3">
          <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            Sair
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">Fast EPS · Painel</span>
            <form action="/api/admin/auth/logout" method="POST">
              <button type="submit" className="text-sm text-slate-400 hover:text-slate-700">
                Sair
              </button>
            </form>
          </div>
          <nav className="flex gap-4 overflow-x-auto px-4 pb-3 text-sm text-slate-500">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 hover:text-brand-700">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>
      </div>
    </div>
  );
}
