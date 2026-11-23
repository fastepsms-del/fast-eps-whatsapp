import { NextResponse } from "next/server";
import { evolutionConfig, evolutionFetch, instancePath } from "@/lib/whatsapp/evolutionClient";
import { whatsappProvider } from "@/lib/whatsapp/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

/** Estado da conexão do número no Evolution; se ainda não estiver conectado, devolve o QR code. */
export async function GET(): Promise<NextResponse> {
  try {
    evolutionConfig();
  } catch (error) {
    return NextResponse.json({ configured: false, provider: whatsappProvider(), error: String(error) });
  }

  try {
    const stateResponse = await evolutionFetch(instancePath("/instance/connectionState"));
    const state = await readJson(stateResponse);
    const connected = (state as { instance?: { state?: string } } | null)?.instance?.state === "open";

    let qr: unknown = null;
    if (!connected && stateResponse.ok) {
      qr = await readJson(await evolutionFetch(instancePath("/instance/connect")));
    }

    return NextResponse.json({
      configured: true,
      provider: whatsappProvider(),
      instanceFound: stateResponse.ok,
      httpStatus: stateResponse.status,
      connected,
      state,
      qr,
    });
  } catch (error) {
    return NextResponse.json({ configured: true, provider: whatsappProvider(), error: String(error) });
  }
}
