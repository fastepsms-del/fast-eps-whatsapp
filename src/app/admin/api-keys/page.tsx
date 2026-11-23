import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage({ searchParams }: { searchParams: { created?: string } }) {
  const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Chaves de API</h1>
        <p className="text-sm text-slate-500">
          Use uma chave pra conectar sistemas externos (CRM, automações, etc) à API pública em{" "}
          <code className="rounded bg-slate-100 px-1">/api/v1</code>. Envie no header{" "}
          <code className="rounded bg-slate-100 px-1">Authorization: Bearer &lt;chave&gt;</code>.
        </p>
      </div>

      {searchParams.created && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-2 text-sm font-medium text-emerald-800">
            Chave criada — copie agora, ela não vai aparecer de novo:
          </p>
          <code className="block break-all rounded bg-white px-3 py-2 text-sm text-slate-800">
            {searchParams.created}
          </code>
        </div>
      )}

      <form action="/api/admin/api-keys" method="POST" className="flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="flex flex-col text-sm text-slate-600">
          <span className="mb-1">Nome/identificação da chave</span>
          <input name="label" required placeholder="ex: CRM Interno, Zapier, n8n..." className="select w-64" />
        </label>
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Criar nova chave
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Prefixo</th>
              <th className="px-4 py-3">Criada em</th>
              <th className="px-4 py-3">Último uso</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{key.label}</td>
                <td className="px-4 py-3">
                  <code className="text-xs text-slate-500">{key.keyPrefix}…</code>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(key.createdAt).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString("pt-BR") : "nunca usada"}
                </td>
                <td className="px-4 py-3">
                  {key.revokedAt ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">Revogada</span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Ativa</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!key.revokedAt && (
                    <form action={`/api/admin/api-keys/${key.id}/revoke`} method="POST">
                      <button type="submit" className="text-xs text-red-600 hover:underline">
                        Revogar
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma chave criada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
