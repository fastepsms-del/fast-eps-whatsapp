import { prisma } from "@/lib/db/prisma";
import type { AdminUser } from "@prisma/client";

export const dynamic = "force-dynamic";

const NOTICES: Record<string, { text: string; ok: boolean }> = {
  criado: { text: "Atendente criado.", ok: true },
  ativado: { text: "Atendente ativado.", ok: true },
  desativado: { text: "Atendente desativado. Ele não consegue mais entrar (a sessão aberta vale até 12h).", ok: true },
  senha_alterada: { text: "Senha alterada.", ok: true },
  usuario_invalido: { text: "Usuário inválido: use de 3 a 30 letras minúsculas, números, ponto, hífen ou sublinhado.", ok: false },
  nome_obrigatorio: { text: "Informe o nome do atendente.", ok: false },
  senha_curta: { text: "A senha precisa ter pelo menos 8 caracteres.", ok: false },
  usuario_existe: { text: "Já existe um usuário com esse nome de login.", ok: false },
  erro_banco: { text: "Não foi possível salvar. Confira se a migração abaixo já foi executada.", ok: false },
};

export default async function UsersPage({ searchParams }: { searchParams: { notice?: string } }) {
  let users: AdminUser[] = [];
  let tableMissing = false;
  try {
    users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  } catch {
    tableMissing = true;
  }

  const notice = searchParams.notice ? NOTICES[searchParams.notice] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Atendentes</h1>
        <p className="text-sm text-slate-500">
          Cada pessoa da equipe entra com o próprio login. Atendentes veem só os leads e as conversas; administradores
          veem e configuram tudo. O login-mestre das variáveis de ambiente continua funcionando como administrador.
        </p>
      </div>

      {notice && (
        <p className={`rounded-md px-3 py-2 text-sm ${notice.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {notice.text}
        </p>
      )}

      {tableMissing && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="mb-2 font-medium">A tabela de atendentes ainda não existe no banco.</p>
          <p>
            Abra uma vez{" "}
            <a href="/api/admin/run-migration-admin-users" className="underline">
              /api/admin/run-migration-admin-users
            </a>{" "}
            (precisa estar logado como administrador) e depois volte aqui.
          </p>
        </div>
      )}

      {!tableMissing && (
        <form action="/api/admin/users" method="POST" className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <label className="flex flex-col text-sm text-slate-600">
            <span className="mb-1">Nome</span>
            <input name="displayName" required placeholder="ex: Caio" className="select" />
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            <span className="mb-1">Login</span>
            <input name="username" required placeholder="ex: caio" className="select" autoComplete="off" />
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            <span className="mb-1">Senha (mín. 8)</span>
            <input name="password" type="password" required minLength={8} className="select" autoComplete="new-password" />
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            <span className="mb-1">Papel</span>
            <select name="role" defaultValue="ATTENDANT" className="select">
              <option value="ATTENDANT">Atendente</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
          <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Criar
          </button>
        </form>
      )}

      {users.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Login</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Último acesso</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Nova senha</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{user.displayName}</td>
                  <td className="px-4 py-3 text-slate-500">{user.username}</td>
                  <td className="px-4 py-3">{user.role === "ADMIN" ? "Administrador" : "Atendente"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" }) : "nunca"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={`/api/admin/users/${user.id}/toggle`} method="POST" className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${user.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {user.active ? "Ativo" : "Desativado"}
                      </span>
                      <button type="submit" className="text-xs text-slate-500 hover:underline">
                        {user.active ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={`/api/admin/users/${user.id}/password`} method="POST" className="flex items-center gap-2">
                      <input name="password" type="password" required minLength={8} placeholder="nova senha" className="select w-32" autoComplete="new-password" />
                      <button type="submit" className="text-xs text-brand-600 hover:underline">
                        Trocar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
