import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fast EPS · Atendimento WhatsApp",
  description: "Automação de atendimento via WhatsApp com IA para a Fast EPS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
