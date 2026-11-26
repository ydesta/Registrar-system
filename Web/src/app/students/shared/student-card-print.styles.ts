export const STUDENT_CARD_PRINT_IMAGE_WAIT_MS = 8000;
export const STUDENT_CARD_PRINT_STYLE_WAIT_MS = 4000;

/** Gap between front and back when both print on one page (mm). */
export const STUDENT_CARD_PRINT_FACE_GAP_MM = 4;

/** Base CSS injected into the print iframe (exact colors, page breaks). */
export const STUDENT_CARD_PRINT_BASE_CSS = `
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  /* One sheet = front + back together — no extra white frame around the design. */
  .card-print-page {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: ${STUDENT_CARD_PRINT_FACE_GAP_MM}mm;
    overflow: hidden;
    background: #fff;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    break-after: page;
    page-break-after: always;
  }
  .card-print-page:last-child {
    break-after: auto;
    page-break-after: auto;
  }
  .card-print-face {
    flex: 0 0 auto;
    line-height: 0;
    overflow: hidden;
    width: 100%;
  }
  .card-print-page .face-label,
  .card-print-page .no-print,
  .card-print-page .student-banner {
    display: none !important;
  }
  /*
   * Match the print-modal card edge: rounded clip so header/footer bleed to the
   * corner (no white halo). Box-shadow does not print — use a thin brand edge.
   */
  .card-print-page .card-face,
  .card-print-page app-student-card-face {
    display: block !important;
    width: 100% !important;
    max-width: none !important;
    box-sizing: border-box !important;
  }
  .card-print-page .card-face {
    border-radius: 2.2mm !important;
    overflow: hidden !important;
    box-shadow: none !important;
    border: 0.45mm solid #0E2F66 !important;
    background-color: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  .card-print-page .card-bg {
    border-radius: 0 !important;
  }
  .card-print-page .el-shape,
  .card-print-page .el {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  .card-print-page .el-shape {
    background-clip: border-box !important;
  }
  @media screen {
    .card-print-page { margin: 8px auto; }
  }
`;

/**
 * Page size fits front + optional back on a single sheet (exact CR80, no pad).
 * @param hasBack when true, page height = 2× card height + gap
 */
export function buildStudentCardPageCss(
  widthMm: number,
  heightMm: number,
  hasBack = true
): string {
  const gap = STUDENT_CARD_PRINT_FACE_GAP_MM;
  const pageWidth = widthMm;
  const pageHeight = hasBack ? heightMm * 2 + gap : heightMm;
  const pageName = `card-${String(widthMm).replace('.', '_')}-x-${String(heightMm).replace('.', '_')}-sheet`;
  return (
    `@page { size: ${pageWidth}mm ${pageHeight}mm; margin: 0; }\n` +
    `@page ${pageName} { size: ${pageWidth}mm ${pageHeight}mm; margin: 0; }\n` +
    `.card-print-page { page: ${pageName}; width: ${pageWidth}mm; min-height: ${pageHeight}mm; }\n` +
    `.card-print-page .card-face { width: ${widthMm}mm !important; height: ${heightMm}mm !important; }`
  );
}
