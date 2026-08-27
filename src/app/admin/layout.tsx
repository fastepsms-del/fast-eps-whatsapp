import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-slate-800">Fast EPS · Painel</span>
            <nav className="flex gap-4 text-sm text-slate-500">
              <Link href="/admin" className="hover:text-brand-700">
                Leads
              </Link>
              <Link href="/admin/settings" className="hover:text-brand-700">
                Configurações
              </Link>
              <Link href="/admin/logs" className="hover:text-brand-700">
                Logs
              </Link>
            </nav>
          </div>
          <form action="/api/admin/auth/logout" method="POST">
            <button type="submit" className="text-sm text-slate-400 hover:text-slate-700">
              Sair
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
