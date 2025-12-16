import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Heritage OS (HDX)",
  description: "회원권 명의개서 서류 처리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
