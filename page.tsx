export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = searchParams.next ?? "/admin";
  const hasError = searchParams.error === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form
        action="/api/admin/auth/login"
        method="POST"
        className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="mb-1 text-lg font-semibold text-slate-800">Fast EPS · Painel</h1>
        <p className="mb-4 text-sm text-slate-500">Entre com as credenciais administrativas.</p>

        {hasError && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">Usuário ou senha inválidos.</p>
        )}

        <input type="hidden" name="next" value={next} />

        <label className="mb-3 block text-sm">
          <span className="mb-1 block text-slate-600">Usuário</span>
          <input
            name="username"
            required
            autoFocus
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <label className="mb-4 block text-sm">
          <span className="mb-1 block text-slate-600">Senha</span>
          <input
            type="password"
            name="password"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
