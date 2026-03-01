import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
