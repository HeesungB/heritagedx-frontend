import html2canvas from "html2canvas";

// JPEG 출력 상수
const JPEG_PAGE_WIDTH = 1050;
const JPEG_PAGE_HEIGHT = 1480;

// 브라우저 인쇄 상수 (A4 @96dpi)
const A4_PRINT_WIDTH_PX = 680; // ~180mm
const A4_PRINT_HEIGHT_PX = 1047; // ~277mm

const MIN_SCALE = 0.5;

/**
 * 시트 요소를 단일 A4 페이지 JPEG로 캡처한다.
 * 내용이 길면 자동 축소하여 한 장에 맞춘다.
 */
export async function captureSheetAsJpeg(
  element: HTMLElement,
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const widthScale = JPEG_PAGE_WIDTH / canvas.width;
  const scaledHeight = canvas.height * widthScale;

  let fitScale = 1;
  if (scaledHeight > JPEG_PAGE_HEIGHT) {
    fitScale = Math.max(MIN_SCALE, JPEG_PAGE_HEIGHT / scaledHeight);
  }

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = JPEG_PAGE_WIDTH;
  outputCanvas.height = JPEG_PAGE_HEIGHT;
  const ctx = outputCanvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, JPEG_PAGE_WIDTH, JPEG_PAGE_HEIGHT);

  const drawWidth = JPEG_PAGE_WIDTH * fitScale;
  const drawHeight = scaledHeight * fitScale;

  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, drawWidth, drawHeight);

  return new Promise<Blob>((resolve) => {
    outputCanvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.92);
  });
}

/**
 * 브라우저 인쇄 시 시트가 A4 한 장에 맞도록 zoom을 적용한다.
 * afterprint 이벤트에서 zoom을 복원한다.
 */
export function printSheetFitToPage(element: HTMLElement): void {
  // 1. 인쇄 영역 폭으로 높이 시뮬레이션 측정
  const origWidth = element.style.width;
  const origMaxWidth = element.style.maxWidth;
  const origPadding = element.style.padding;

  element.style.width = `${A4_PRINT_WIDTH_PX}px`;
  element.style.maxWidth = `${A4_PRINT_WIDTH_PX}px`;
  element.style.padding = "0";

  // 리플로 강제
  const measuredHeight = element.scrollHeight;

  // 원래 스타일 복원
  element.style.width = origWidth;
  element.style.maxWidth = origMaxWidth;
  element.style.padding = origPadding;

  // 2. 축소 비율 계산
  let scale = 1;
  if (measuredHeight > A4_PRINT_HEIGHT_PX) {
    scale = Math.max(MIN_SCALE, A4_PRINT_HEIGHT_PX / measuredHeight);
  }

  // 3. zoom 적용
  if (scale < 1) {
    element.style.zoom = String(scale);
  }

  // 4. afterprint에서 zoom 복원
  const restore = () => {
    element.style.zoom = "";
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);

  // 5. 인쇄 실행
  window.print();
}
