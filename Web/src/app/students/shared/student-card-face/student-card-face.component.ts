import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import * as QRCode from 'qrcode';
import { environment } from 'src/environments/environment';
import { DesignElement, isLockedDesignElement } from '../../card-template-designer/design-element.model';
import {
  CARD_BRAND,
  CARD_DESIGNER_PX_PER_MM,
  DEFAULT_COLLEGE_LOGO_ASSET,
  resolveCardMediaUrl,
  resolveElementText,
  resolveQrPayload
} from '../../card-template-designer/card-layout.model';

/**
 * Washes that should clear when a template background image is set
 * (so the artwork shows through the content area). Header chrome stays opaque.
 */
const BACKGROUND_COVER_IDS = /^(body-bg|back-body|back-panel|row-bg-)/;

@Component({
  selector: 'app-student-card-face',
  templateUrl: './student-card-face.component.html',
  styleUrls: ['./student-card-face.component.scss']
})
export class StudentCardFaceComponent implements OnChanges {
  @Input() widthMm = 85.6;
  @Input() heightMm = 53.98;
  @Input() elements: DesignElement[] = [];
  @Input() values: Record<string, string> = {};
  @Input() backgroundUrl: string | null = null;
  @Input() interactive = false;
  @Input() selectedId: string | null = null;
  @Input() scale = 1;
  @Output() elementMouseDown = new EventEmitter<{ el: DesignElement; event: MouseEvent }>();
  @Output() elementClick = new EventEmitter<DesignElement>();

  readonly pxPerMm = CARD_DESIGNER_PX_PER_MM;
  private readonly fileUrl = environment.fileUrl;
  qrDataUrls: Record<string, SafeUrl> = {};
  /** college.logo with black background removed (and emblem cropped for header). */
  logoDataUrls: Record<string, SafeUrl> = {};
  /** Template background as printable <img> (not CSS background-image). */
  safeBackgroundSrc: SafeUrl | null = null;
  /** True only after card-bg has decoded — avoids clearing washes when the image failed. */
  hasBackgroundArt = false;
  private logoCache = new Map<string, string>();

  constructor(private readonly sanitizer: DomSanitizer) {}

  get widthPx(): number {
    return Math.round(this.widthMm * this.pxPerMm * this.scale);
  }

  get heightPx(): number {
    return Math.round(this.heightMm * this.pxPerMm * this.scale);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['backgroundUrl']) {
      this.updateSafeBackground();
    }
    if (changes['elements'] || changes['values'] || changes['scale']) {
      this.refreshLogos();
      this.refreshQrCodes();
    }
  }

  private updateSafeBackground(): void {
    const url = (this.backgroundUrl || '').trim();
    this.hasBackgroundArt = false;
    if (!url) {
      this.safeBackgroundSrc = null;
      return;
    }
    this.safeBackgroundSrc = this.sanitizer.bypassSecurityTrustUrl(url);
  }

  onBackgroundLoad(): void {
    this.hasBackgroundArt = true;
  }

  onBackgroundError(): void {
    this.hasBackgroundArt = false;
    this.safeBackgroundSrc = null;
  }

  text(el: DesignElement): string {
    return resolveElementText(el, this.values);
  }

  isLocked(el: DesignElement): boolean {
    return isLockedDesignElement(el);
  }

  /** Circular profile photo + matching ring/inner wash shapes. */
  isPhotoCircle(el: DesignElement): boolean {
    if (el.type === 'image' && el.sourcePath === 'student.photo') {
      return true;
    }
    return /^(photo-ring|photo-inner|photo-matte|photo-halo)$/.test(el.id || '');
  }

  /** Soft ellipse waves used by the optional portrait starter. */
  isWaveEllipse(el: DesignElement): boolean {
    return /^(wave-deep|wave-mid|wave-soft|wave-white|footer-wave)$/.test(el.id || '');
  }

  isWatermark(el: DesignElement): boolean {
    return /^(watermark-logo|watermark-mark)$/.test(el.id || '');
  }

  isWatermarkLogo(el: DesignElement): boolean {
    return el.id === 'watermark-logo';
  }

  isWatermarkText(el: DesignElement): boolean {
    return el.id === 'watermark-mark';
  }

  isSeal(el: DesignElement): boolean {
    return el.id === 'seal-stamp' || el.sourcePath === 'college.seal';
  }

  /** Header/footer college mark drawn as a round badge. Missing shape stays a circle. */
  isCircleLogo(el: DesignElement): boolean {
    return this.isCollegeLogo(el) && el.logoShape !== 'rectangle';
  }

  /** Full banner artwork. Width is the element's wMm. */
  isRectLogo(el: DesignElement): boolean {
    return this.isCollegeLogo(el) && el.logoShape === 'rectangle';
  }

  private isCollegeLogo(el: DesignElement): boolean {
    return el.type === 'image' && el.sourcePath === 'college.logo' && !this.isWatermark(el) && !this.isSeal(el);
  }

  imageUrl(el: DesignElement): string | null {
    if (el.type !== 'image') {
      return null;
    }
    let raw = (this.values[el.sourcePath] || '').trim();
    if (!raw && el.sourcePath === 'college.logo') {
      raw = DEFAULT_COLLEGE_LOGO_ASSET;
    }
    // Watermark may fall back to college logo when only text mark is used.
    if (!raw && el.sourcePath === 'college.watermark') {
      raw = (this.values['college.logo'] || '').trim() || DEFAULT_COLLEGE_LOGO_ASSET;
    }
    if (!raw) {
      return null;
    }
    return resolveCardMediaUrl(raw, this.fileUrl) || null;
  }

  safeImageSrc(el: DesignElement): SafeUrl | string | null {
    if (
      el.type === 'image' &&
      (el.sourcePath === 'college.logo' ||
        el.sourcePath === 'college.watermark' ||
        el.sourcePath === 'college.seal')
    ) {
      return this.logoDataUrls[el.id] || this.logoDataUrls['__default'] || null;
    }
    const url = this.imageUrl(el);
    if (!url) {
      return null;
    }
    if (url.startsWith('data:image/')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  }

  qrUrl(el: DesignElement): SafeUrl | null {
    return this.qrDataUrls[el.id] || null;
  }

  elStyle(el: DesignElement): Record<string, string> {
    const style: Record<string, string> = {
      left: `${el.xMm * this.pxPerMm * this.scale}px`,
      top: `${el.yMm * this.pxPerMm * this.scale}px`,
      width: `${el.wMm * this.pxPerMm * this.scale}px`,
      height: `${el.hMm * this.pxPerMm * this.scale}px`,
      fontSize: `${(el.fontSizePt || 8) * this.scale}pt`,
      fontWeight: el.fontWeight || 'normal',
      fontFamily: el.fontFamily || 'Segoe UI, Arial, sans-serif',
      color: el.color || '#111827',
      textAlign: el.align || 'left'
    };
    if (el.type === 'shape') {
      const coverBg = this.hasBackgroundArt && BACKGROUND_COVER_IDS.test(el.id || '');
      style['backgroundColor'] = coverBg ? 'transparent' : (el.fill || CARD_BRAND);
      style['zIndex'] = this.isLocked(el) ? '0' : '1';
      style['color'] = 'transparent';
    } else if (el.fill) {
      style['backgroundColor'] = el.fill;
    }
    if (this.interactive && this.isLocked(el)) {
      style['pointerEvents'] = 'none';
    }
    if (this.isWatermark(el)) {
      style['zIndex'] = '0';
      style['pointerEvents'] = 'none';
      style['backgroundColor'] = 'transparent';
    }
    return style;
  }

  onMouseDown(el: DesignElement, event: MouseEvent): void {
    if (!this.interactive || this.isLocked(el)) {
      return;
    }
    // Stop native image/text drag from hijacking our move handlers.
    event.preventDefault();
    event.stopPropagation();
    this.elementMouseDown.emit({ el, event });
  }

  onClick(el: DesignElement): void {
    if (!this.interactive || this.isLocked(el)) {
      return;
    }
    this.elementClick.emit(el);
  }

  private refreshLogos(): void {
    const raw = this.resolveAbsoluteUrl(this.values['college.logo'] || DEFAULT_COLLEGE_LOGO_ASSET);
    const logoEls = (this.elements || []).filter(
      el =>
        el.type === 'image' &&
        (el.sourcePath === 'college.logo' ||
          el.sourcePath === 'college.watermark' ||
          el.sourcePath === 'college.seal')
    );
    if (!logoEls.length) {
      this.logoDataUrls = {};
      return;
    }

    const next: Record<string, SafeUrl> = {};
    const jobs = logoEls.map(async el => {
      try {
        const path =
          el.sourcePath === 'college.watermark'
            ? (this.values['college.watermark'] || this.values['college.logo'] || DEFAULT_COLLEGE_LOGO_ASSET)
            : el.sourcePath === 'college.seal'
              ? (this.values['college.seal'] || '')
              : (this.values['college.logo'] || DEFAULT_COLLEGE_LOGO_ASSET);
        const abs = this.resolveAbsoluteUrl(path);
        if (!abs) {
          return;
        }
        // Circle badge and watermark: emblem crop. Rectangle and seal: full artwork.
        const cropEmblem = el.sourcePath !== 'college.seal' && el.logoShape !== 'rectangle';
        const processed = await this.prepareCollegeLogo(abs, cropEmblem);
        next[el.id] = this.sanitizer.bypassSecurityTrustUrl(processed);
        if (el.sourcePath === 'college.logo') {
          next['__default'] = next[el.id];
        }
      } catch {
        // keep missing → placeholder
      }
    });

    Promise.all(jobs).then(() => {
      this.logoDataUrls = next;
    });
  }

  private refreshQrCodes(): void {
    const next: Record<string, SafeUrl> = {};
    const jobs = (this.elements || [])
      .filter(el => el.type === 'qr')
      .map(async el => {
        const payload = resolveQrPayload(el, this.values);
        if (!payload) {
          return;
        }
        try {
          const px = Math.max(256, Math.round(el.wMm * this.pxPerMm * 3));
          const wantLogo = el.qrLogo !== false;
          const rawLogo = wantLogo
            ? this.resolveAbsoluteUrl(this.values['college.logo'] || DEFAULT_COLLEGE_LOGO_ASSET)
            : null;
          let dataUrl = await this.encodeQr(payload, px, !!rawLogo);
          if (rawLogo) {
            // QR center uses the emblem crop (compact circle).
            const cleanLogo = await this.prepareCollegeLogo(rawLogo, true).catch(() => rawLogo);
            dataUrl = await this.withCenterLogo(dataUrl, cleanLogo).catch(() => dataUrl);
          }
          next[el.id] = this.sanitizer.bypassSecurityTrustUrl(dataUrl);
        } catch {
          // leave missing; UI shows placeholder
        }
      });

    Promise.all(jobs).then(() => {
      this.qrDataUrls = next;
    });
  }

  /**
   * log.png ships with a solid black backdrop. Knock that out and optionally
   * crop to the top circular emblem so the header does not show a black box.
   */
  private async prepareCollegeLogo(src: string, cropEmblem: boolean): Promise<string> {
    const key = `${src}|${cropEmblem ? 'emblem-only-v4' : 'full'}`;
    const cached = this.logoCache.get(key);
    if (cached) {
      return cached;
    }

    const img = await this.loadLogoImage(src);
    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;

    let sx = 0;
    let sy = 0;
    let sw = nw;
    let sh = nh;

    if (cropEmblem) {
      // Clean badge: circular emblem ONLY (HiLCoE text stays in the header beside it).
      if (nh >= nw * 1.15) {
        // Vertical log.png — top square is the blue circle mark.
        const side = nw;
        sx = 0;
        sy = Math.max(0, Math.round(side * 0.02));
        sw = side;
        sh = side;
      } else if (nw > nh * 1.4) {
        const side = nh;
        sx = 0;
        sy = 0;
        sw = side;
        sh = side;
      } else {
        const side = Math.min(nw, nh);
        sx = Math.round((nw - side) / 2);
        sy = Math.round((nh - side) / 2);
        sw = side;
        sh = side;
      }
    }

    const tmp = document.createElement('canvas');
    tmp.width = sw;
    tmp.height = sh;
    const tctx = tmp.getContext('2d');
    if (!tctx) {
      return src;
    }
    tctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const imageData = tctx.getImageData(0, 0, sw, sh);
    const px = imageData.data;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      if (r < 48 && g < 48 && b < 48) {
        px[i + 3] = 0;
      }
    }
    tctx.putImageData(imageData, 0, 0);

    if (cropEmblem) {
      const side = Math.max(sw, 320);
      const masked = document.createElement('canvas');
      masked.width = side;
      masked.height = side;
      const mctx = masked.getContext('2d');
      if (mctx) {
        const r = side / 2;
        mctx.beginPath();
        mctx.arc(r, r, r, 0, Math.PI * 2);
        mctx.fillStyle = '#ffffff';
        mctx.fill();
        mctx.save();
        mctx.beginPath();
        mctx.arc(r, r, r * 0.9, 0, Math.PI * 2);
        mctx.clip();
        // Emblem fills most of the badge with clear padding — no clipped wordmark.
        const fit = (side * 0.78) / Math.max(sw, sh);
        const dw = sw * fit;
        const dh = sh * fit;
        mctx.drawImage(tmp, (side - dw) / 2, (side - dh) / 2, dw, dh);
        mctx.restore();
        const out = masked.toDataURL('image/png');
        this.logoCache.set(key, out);
        return out;
      }
    }

    const out = tmp.toDataURL('image/png');
    this.logoCache.set(key, out);
    return out;
  }

  private async encodeQr(payload: string, px: number, withLogo: boolean): Promise<string> {
    const levels: Array<'M' | 'Q' | 'H'> = withLogo ? ['H', 'Q', 'M'] : ['M', 'Q'];
    let lastError: unknown;
    for (const level of levels) {
      try {
        return await QRCode.toDataURL(payload, {
          errorCorrectionLevel: level,
          margin: 2,
          width: px,
          color: { dark: '#111827', light: '#ffffff' }
        });
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('QR encode failed');
  }

  private resolveAbsoluteUrl(raw: string | null | undefined): string | null {
    const value = resolveCardMediaUrl(raw, this.fileUrl);
    return value || null;
  }

  /** Circular white pad + college logo centered on the QR (no hard square). */
  private async withCenterLogo(qrUrl: string, logoUrl: string): Promise<string> {
    const [qr, logo] = await Promise.all([this.loadImage(qrUrl), this.loadLogoImage(logoUrl)]);
    const size = qr.naturalWidth || qr.width;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return qrUrl;
    }
    ctx.drawImage(qr, 0, 0, size, size);

    const box = size * 0.2;
    const cx = size / 2;
    const cy = size / 2;
    const r = box / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
    ctx.clip();
    const inner = box * 0.9;
    const ratio = Math.min(inner / Math.max(logo.naturalWidth, 1), inner / Math.max(logo.naturalHeight, 1));
    const w = logo.naturalWidth * ratio;
    const h = logo.naturalHeight * ratio;
    ctx.drawImage(logo, (size - w) / 2, (size - h) / 2, w, h);
    ctx.restore();

    return canvas.toDataURL('image/png');
  }

  /** Prefer blob fetch so uploaded logos work even without CORS on the file host. */
  private async loadLogoImage(src: string): Promise<HTMLImageElement> {
    if (src.startsWith('data:')) {
      return this.loadImage(src);
    }
    try {
      const response = await fetch(src, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) {
        throw new Error('Logo fetch failed');
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      try {
        return await this.loadImage(objectUrl);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      return this.loadImage(src);
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      if (!src.startsWith('data:') && !src.startsWith('blob:')) {
        image.crossOrigin = 'anonymous';
      }
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Image could not be loaded.'));
      image.src = src;
    });
  }

}
