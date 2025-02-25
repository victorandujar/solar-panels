import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMessages } from "../helpers/getMessages";

export const metadata: Metadata = {
  title: "Ammaëth",
  description: "Diseñar es recordar lo que la materia olvidó.",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { locale } = params;

  const messages = await getMessages(locale, notFound);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
