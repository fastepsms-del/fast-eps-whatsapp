import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold text-slate-800">Fast EPS · Atendimento WhatsApp com IA</h1>
      <p className="max-w-md text-sm text-slate-500">
        Este serviço expõe o webhook do WhatsApp em <code>/api/webhook/whatsapp</code> e o painel
        administrativo em <code>/admin</code>.
      </p>
      <Link href="/admin" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
        Acessar painel administrativo
      </Link>
    </main>
  );
}
