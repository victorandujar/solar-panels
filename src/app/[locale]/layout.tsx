// src/app/[locale]/layout.tsx
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMessages } from "../helpers/getMessages";
import EnergyBackground from "../components/EnergyBackground/EnergyBackground";
import ThreeCanvas from "../components/ThreeCanvas/ThreeCanvas";
import { SceneProvider } from "../context/SceneContext";

export const metadata: Metadata = {
  title: "Solar plant - prototype",
  description: "Solar plant - prototype",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages(locale, notFound);

  // Nota: Como RootLayout es un Server Component, no puedes usar useRef directamente.
  // Usamos un div con id para el eventSource y manejamos el ref en el cliente.
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        <div id="root-container" className="relative w-full h-screen">
          <SceneProvider>
            <ThreeCanvas />
            <EnergyBackground />
            <NextIntlClientProvider locale={locale} messages={messages}>
              {children}
            </NextIntlClientProvider>
          </SceneProvider>
        </div>
      </body>
    </html>
  );
}
