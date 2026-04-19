// JPEG 출력 상수 (논리 크기 × 2배 해상도)
const JPEG_PAGE_WIDTH = 1050;
const JPEG_PAGE_HEIGHT = 1480;
const RETINA_SCALE = 2;
const OUTPUT_WIDTH = JPEG_PAGE_WIDTH * RETINA_SCALE; // 2100
const OUTPUT_HEIGHT = JPEG_PAGE_HEIGHT * RETINA_SCALE; // 2960

// 브라우저 인쇄 상수 (A4 @96dpi)
const A4_PRINT_WIDTH_PX = 680; // ~180mm
const A4_PRINT_HEIGHT_PX = 1047; // ~277mm

const MIN_SCALE = 0.25;

/**
 * 시트 요소를 단일 A4 페이지 JPEG로 캡처한다.
 * 내용이 길면 자동 축소하여 한 장에 맞춘다.
 */
export async function captureSheetAsJpeg(
  element: HTMLElement,
): Promise<Blob> {
  // 1. 렌더 폭 = JPEG 논리 폭 (1050px > max-w-4xl 896px → 잘림 없음)
  const renderWidth = JPEG_PAGE_WIDTH;

  // 2. 렌더 폭으로 확장 — toCanvas가 클론할 때 자식 요소도 이 레이아웃 기준으로 computed style이 잡힘
  const origWidth = element.style.width;
  const origMaxWidth = element.style.maxWidth;
  element.style.width = `${renderWidth}px`;
  element.style.maxWidth = `${renderWidth}px`;
  void element.offsetHeight;
  const renderHeight = element.scrollHeight;

  // 3. 확장 상태 유지한 채 toCanvas 호출 → 자식까지 올바른 폭으로 클론
  //    html-to-image 는 초기 번들 미포함 — 인쇄/캡처 호출 시점에만 로드 (1-2)
  const { toCanvas } = await import("html-to-image");
  let canvas: HTMLCanvasElement;
  try {
    canvas = await toCanvas(element, {
      width: renderWidth,
      height: renderHeight,
      style: {
        maxWidth: "none",
        width: `${renderWidth}px`,
        margin: "0",
      },
      pixelRatio: OUTPUT_WIDTH / renderWidth,
      backgroundColor: "#ffffff",
      filter: (node: HTMLElement) => {
        if (node.classList?.contains("print:hidden")) return false;
        return true;
      },
    });
  } finally {
    // 4. 원래 스타일 복원 (에러 시에도 반드시 복원)
    element.style.width = origWidth;
    element.style.maxWidth = origMaxWidth;
  }

  // 5. 가로·세로 모두 체크하여 출력 영역에 맞춤
  const widthScale = OUTPUT_WIDTH / canvas.width;
  const heightScale = OUTPUT_HEIGHT / canvas.height;
  const fitScale = Math.max(MIN_SCALE, Math.min(1, widthScale, heightScale));

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = OUTPUT_WIDTH;
  outputCanvas.height = OUTPUT_HEIGHT;
  const ctx = outputCanvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  const drawWidth = canvas.width * fitScale;
  const drawHeight = canvas.height * fitScale;

  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, drawWidth, drawHeight);

  return new Promise<Blob>((resolve) => {
    outputCanvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.95);
  });
}

/**
 * 브라우저 인쇄 시 시트가 A4 한 장에 맞도록 zoom을 적용한다.
 * afterprint 이벤트에서 zoom을 복원한다.
 */
export function printSheetFitToPage(element: HTMLElement): void {
  // 1. 인쇄 시 조건과 동일하게 측정 (print:p-4 = 1rem padding)
  const origWidth = element.style.width;
  const origMaxWidth = element.style.maxWidth;
  const origPadding = element.style.padding;

  element.style.width = `${A4_PRINT_WIDTH_PX}px`;
  element.style.maxWidth = `${A4_PRINT_WIDTH_PX}px`;
  element.style.padding = "1rem"; // print:p-4 와 동일

  // 리플로 강제
  const measuredHeight = element.scrollHeight;

  // 원래 스타일 복원
  element.style.width = origWidth;
  element.style.maxWidth = origMaxWidth;
  element.style.padding = origPadding;

  // 2. 축소 비율 계산 (안전 여백 포함)
  const safeHeight = A4_PRINT_HEIGHT_PX - 20;
  let scale = 1;
  if (measuredHeight > safeHeight) {
    scale = Math.max(MIN_SCALE, safeHeight / measuredHeight);
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
