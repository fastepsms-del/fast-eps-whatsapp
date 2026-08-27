import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const logs = await prisma.integrationLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-slate-800">Logs de integração</h1>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Quando</th>
              <th className="px-4 py-2">Escopo</th>
              <th className="px-4 py-2">Nível</th>
              <th className="px-4 py-2">Mensagem</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100 align-top">
                <td className="whitespace-nowrap px-4 py-2 text-xs text-slate-400">{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-2 text-xs text-slate-500">{log.scope}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.level === "error"
                        ? "bg-red-100 text-red-700"
                        : log.level === "warn"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {log.level}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-700">{log.message}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Nenhum log registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
