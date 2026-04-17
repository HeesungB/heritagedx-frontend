import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Heritage OS (HDX)",
  description: "회원권 명의개서 서류 처리",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${notoSansKR.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  window.addEventListener("error", function(e) {
    var msg = (e.message || "") + " " + ((e.filename || ""));
    var isChunkError =
      (e.error instanceof SyntaxError && /chunks/.test(e.filename || "")) ||
      /ChunkLoadError|Loading chunk/.test(msg);
    if (!isChunkError) return;
    try {
      var key = "__chunk_reload";
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      window.location.reload();
    } catch(ex) {}
  });
})();
`,
          }}
        />
      </head>
      <body className="antialiased">
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
