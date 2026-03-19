import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HYROX Ticket Watch",
  description: "HYROX sold-out ticket monitoring service with email alerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
