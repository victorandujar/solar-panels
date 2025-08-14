import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMessages } from "../helpers/getMessages";
import EnergyBackground from "../components/EnergyBackground/EnergyBackground";

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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`antialiased`}>
        <EnergyBackground />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
