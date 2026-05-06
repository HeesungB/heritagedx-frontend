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
 * 시트 element 에서 body 까지 올라가면서 각 ancestor 의 형제(시트 chain 에 속하지 않는 노드)에
 * 인쇄 동안 inline `display: none !important` 를 부여한다.
 * 모달처럼 페이지 본문 위에 떠 있는 컨텍스트에서도 시트만 인쇄되도록 한다.
 *
 * inline + !important 를 쓰는 이유: globals.css 의 `.flex:not(.print\:hidden)` 같은
 * specificity 0,2,0 룰이 단순 attribute selector 룰을 이기는 경우가 있어서 우회.
 * 반환된 스냅샷은 afterprint 에서 그대로 복원에 사용한다.
 */
interface PrintHideSnapshot {
  node: HTMLElement;
  origDisplay: string;
  origPriority: string;
}

function hidePrintSiblings(element: HTMLElement): PrintHideSnapshot[] {
  const hidden: PrintHideSnapshot[] = [];
  let cur: HTMLElement | null = element;
  while (cur && cur !== document.body) {
    const parentEl: HTMLElement | null = cur.parentElement;
    if (!parentEl) break;
    for (const sib of Array.from(parentEl.children)) {
      if (sib !== cur && sib instanceof HTMLElement) {
        hidden.push({
          node: sib,
          origDisplay: sib.style.getPropertyValue("display"),
          origPriority: sib.style.getPropertyPriority("display"),
        });
        sib.style.setProperty("display", "none", "important");
      }
    }
    cur = parentEl;
  }
  return hidden;
}

function restorePrintSiblings(snapshots: PrintHideSnapshot[]): void {
  for (const { node, origDisplay, origPriority } of snapshots) {
    if (origDisplay) {
      node.style.setProperty("display", origDisplay, origPriority);
    } else {
      node.style.removeProperty("display");
    }
  }
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

  // 4. 시트 chain 외의 형제 노드 인쇄 동안 inline display:none 으로 숨김
  const hidden = hidePrintSiblings(element);

  // 5. afterprint에서 zoom + 형제 inline style 복원
  const restore = () => {
    element.style.zoom = "";
    restorePrintSiblings(hidden);
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);

  // 6. 인쇄 실행
  window.print();
}
