export type DesignElementAlign = 'left' | 'center' | 'right';

export interface DesignElement {
  id: string;
  type: string;
  sourcePath: string;
  xMm: number;
  yMm: number;
  wMm: number;
  hMm: number;
  label?: string;
  fontSizePt?: number;
  fontWeight?: string;
  fontFamily?: string;
  color?: string;
  fill?: string;
  align?: DesignElementAlign;
  staticText?: string;
  /**
   * For type=qr: sourcePaths encoded into the QR payload (add/remove in designer).
   * Example: ['student.fullName', 'student.studentNumber', 'card.cardNumber']
   */
  qrFields?: string[];
  /** For type=qr: draw the college logo in the center of the code. */
  qrLogo?: boolean;
  /**
   * For college.logo images: circle crops to the emblem badge.
   * rectangle shows the full artwork (banner) and allows a wider box.
   * Omitted means circle, so existing templates stay round.
   */
  logoShape?: 'circle' | 'rectangle';
  /**
   * How an image sits in its box.
   * contain = whole image (fit), cover = fill and crop, fill = stretch.
   * Omitted keeps the previous look.
   */
  imageFit?: 'contain' | 'cover' | 'fill';
  /** Layout chrome (borders, washes) — not draggable; pointer-events skipped. */
  locked?: boolean;
}

/** Background / rule / border ids that must not steal drag from fields. */
export function isLockedDesignElement(el: DesignElement): boolean {
  if (el.locked) {
    return true;
  }
  const id = el.id || '';
  return /^(layout-v2|layout-v5|layout-v5b|layout-v5c|layout-v5d|layout-v5e|layout-v5f|layout-v5g|layout-v5h|layout-v3-back|layout-portrait|body-bg|header-band|header-accent|header-wash|header-gold|header-shine|title-banner|title-gold|footer-band|footer-wave|footer-accent|wave-deep|wave-mid|wave-white|wave-soft|border-|back-border|back-body|back-panel|back-rail|back-accent|back-header|back-header-accent|back-title-band|back-head|back-head-line|back-footer-rule|back-footer-band|col-v|row-bg-|row-line-|footer-rule|footer-deco|photo-frame|photo-matte|photo-inner|photo-ring|photo-halo|qr-frame|qr-mat|sig-line|sig-rule|watermark-|seal-stamp|layout-seal|field-rule-|name-rule|class-rule|src-rule|tel-rule|gender-rule|batch-rule|field-[\w-]+-rule|accent-line)/.test(id)
    || /field-[\w-]+-rule$/.test(id);
}
