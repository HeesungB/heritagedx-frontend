/**
 * Document download utilities for OS app.
 * Centralises all fetch + blob + pdf-lib operations so components stay fetch-free.
 */

export async function fetchDocumentBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`다운로드 실패: ${response.status}`);
  }
  return response.blob();
}

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

export async function downloadDocument(
  url: string,
  filename: string,
): Promise<void> {
  const blob = await fetchDocumentBlob(url);
  triggerBrowserDownload(blob, filename);
}

export async function downloadDocuments(
  docs: Array<{ downloadUrl: string; filename: string }>,
  opts?: { delayMs?: number },
): Promise<void> {
  const delay = opts?.delayMs ?? 500;
  for (const doc of docs) {
    try {
      await downloadDocument(doc.downloadUrl, doc.filename);
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (err) {
      console.error(`${doc.filename} 다운로드 실패:`, err);
    }
  }
}

export async function mergePdfUrls(urls: string[]): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const mergedPdf = await PDFDocument.create();

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const pdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    } catch (err) {
      console.error(`PDF 로드 실패 (${url}):`, err);
    }
  }

  if (mergedPdf.getPageCount() === 0) {
    throw new Error("합칠 수 있는 PDF가 없습니다.");
  }

  const bytes = await mergedPdf.save();
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

export function printDocumentInIframe(
  url: string,
  onFallback?: () => void,
): void {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:none;";
  iframe.src = url;

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      if (onFallback) {
        onFallback();
      } else {
        window.open(url, "_blank");
      }
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  iframe.onerror = () => {
    if (onFallback) {
      onFallback();
    } else {
      window.open(url, "_blank");
    }
    document.body.removeChild(iframe);
  };

  document.body.appendChild(iframe);
}
