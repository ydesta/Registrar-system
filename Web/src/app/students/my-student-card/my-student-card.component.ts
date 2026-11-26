import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import * as QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { environment } from 'src/environments/environment';
import {
  CARD_DESIGNER_PX_PER_MM,
  DEFAULT_COLLEGE_LOGO_ASSET,
  cardValuesFromStudentCard,
  collegeLogoOrDefault,
  fixLabeledFieldOverlap,
  parseCardLayout,
  resolveCardMediaUrl,
  stripSignatureFromLayout,
  studentCardScanLink
} from '../card-template-designer/card-layout.model';
import { DesignElement } from '../card-template-designer/design-element.model';
import { StudentCardPrintService } from '../shared/student-card-print.service';

@Component({
  selector: 'app-my-student-card',
  templateUrl: './my-student-card.component.html',
  styleUrls: ['./my-student-card.component.scss']
})
export class MyStudentCardComponent implements OnInit {
  @ViewChild('previewHost') previewHost?: ElementRef<HTMLElement>;
  @ViewChild('exportHost') exportHost?: ElementRef<HTMLElement>;

  loading = true;
  downloading = false;
  /** Renders a full-size off-screen card used only for PDF export. */
  exportReady = false;
  exportValues: Record<string, string> = {};
  exportBackgroundUrl: string | null = null;
  error = '';
  cards: any[] = [];
  active: any = null;
  qrDataUrl: string | null = null;
  scanHref = '';
  faceWidthMm = 85.6;
  faceHeightMm = 53.98;
  faceElements: DesignElement[] = [];
  backElements: DesignElement[] = [];
  faceValues: Record<string, string> = {};
  faceBackgroundUrl: string | null = null;
  backBackgroundUrl: string | null = null;
  /** Fit-only scale (never enlarge) so the designed card stays true to template size. */
  previewScale = 1;
  private readonly fileUrl = environment.fileUrl;

  constructor(
    private crud: CrudService,
    private notify: CustomNotificationService,
    private cardPrint: StudentCardPrintService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updatePreviewScale();
    this.crud.getList('/student-cards/mine').subscribe({
      next: (res: any) => {
        this.loading = false;
        const status = String(res?.status || '').toLowerCase();
        if (status === 'error') {
          this.error = res?.data || res?.error || 'Unable to load your ID card.';
          return;
        }

        const rows = res?.data || [];
        this.cards = Array.isArray(rows) ? rows : [];
        this.active = this.cards.find(c => this.statusLabel(c.status).toLowerCase() === 'active')
          || this.cards[0]
          || null;
        if (this.active?.qrToken) {
          this.scanHref = studentCardScanLink(this.active.qrToken);
          QRCode.toDataURL(this.scanHref, { errorCorrectionLevel: 'M', margin: 1, width: 180 })
            .then(url => { this.qrDataUrl = url; })
            .catch(() => { this.qrDataUrl = null; });
        }
        setTimeout(() => this.updatePreviewScale(), 0);
      },
      error: (err) => {
        this.loading = false;
        const body = err?.error;
        this.error =
          (typeof body === 'string' && body.trim()) ||
          body?.data ||
          body?.error ||
          body?.message ||
          (err?.status === 0
            ? 'Cannot reach the server. Check your connection and try again.'
            : err?.status === 404
              ? 'ID card API is not available on the server yet.'
              : err?.status === 403
                ? 'You do not have permission to view your ID card.'
                : 'Unable to load your ID card.');
      }
    });

    this.crud.getList('/student-cards/mine/preview').subscribe({
      next: (res: any) => {
        const status = String(res?.status || '').toLowerCase();
        if (status === 'error') {
          return;
        }
        const payload = res?.data?.result || res?.data || res;
        if (!payload || !payload.frontLayoutJson) {
          return;
        }
        this.applyPreviewPayload(payload);
      },
      error: () => {
        // Preview is optional; card metadata from /mine still shows.
      }
    });
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updatePreviewScale();
  }

  private updatePreviewScale(): void {
    const viewport = typeof window !== 'undefined' ? window.innerWidth : 360;
    const hostWidth = this.previewHost?.nativeElement?.clientWidth
      || Math.max(280, viewport - 48);
    const cardPx = Math.max(1, this.faceWidthMm * CARD_DESIGNER_PX_PER_MM);
    // Exact design size on desktop; shrink only when the viewport is narrower than the card.
    this.previewScale = Math.min(1, Math.max(0.45, (hostWidth - 32) / cardPx));
  }

  async downloadCard(): Promise<void> {
    if (!this.faceElements.length || this.downloading) {
      return;
    }

    this.downloading = true;
    try {
      // Rasterize a full-size export face (data-URL media) — same design as print.
      // Avoid html2pdf: it expands for box-shadow / rounded corners and leaves white
      // corner fringes, then places the image top-left on a mis-sized page.
      const exportValues = await this.buildExportValues(this.faceValues);
      const exportBg = this.faceBackgroundUrl
        ? (await this.embedImageAsDataUrl(this.faceBackgroundUrl)) || this.faceBackgroundUrl
        : null;

      this.exportValues = exportValues;
      this.exportBackgroundUrl = exportBg;
      this.exportReady = true;
      this.cdr.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 120));
      const host = this.exportHost?.nativeElement;
      const face = host?.querySelector('.card-face') as HTMLElement | null;
      if (!host || !face) {
        throw new Error('Export surface not ready');
      }

      await this.cardPrint.waitForFaceAssets(face, 10000);

      const widthMm = this.faceWidthMm;
      const heightMm = this.faceHeightMm;
      const fileBase = (this.active?.studentNumber || this.active?.cardNumber || 'student-id')
        .toString()
        .replace(/[^\w.-]+/g, '_');

      const canvas = await html2canvas(face, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        // Exact card bounds — ignore page scroll / off-screen host offset.
        x: 0,
        y: 0,
        width: face.offsetWidth,
        height: face.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: face.offsetWidth,
        windowHeight: face.offsetHeight,
        onclone: (_doc, cloned) => {
          const clonedFace = (cloned as HTMLElement).classList?.contains('card-face')
            ? (cloned as HTMLElement)
            : (cloned as HTMLElement).querySelector?.('.card-face') as HTMLElement | null;
          const target = clonedFace || (cloned as HTMLElement);
          // html2canvas cannot clip border-radius + overflow like print engines —
          // square edges remove the white corner halo. Shadow would inflate the bitmap.
          target.style.boxShadow = 'none';
          target.style.borderRadius = '0';
          target.style.border = 'none';
          target.style.overflow = 'hidden';
          target.style.backgroundColor = '#ffffff';
          target.style.transform = 'none';
          target.style.margin = '0';
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: widthMm >= heightMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [widthMm, heightMm],
        compress: true
      });
      // Fill the CR80 page edge-to-edge (centered when the viewer fits the page).
      pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');
      pdf.save(`${fileBase}-id-card.pdf`);

      this.notify.notification('success', 'Downloaded', 'Your ID card PDF was downloaded.');
    } catch (err) {
      console.error('ID card download failed', err);
      this.notify.notification(
        'error',
        'Download failed',
        'Could not download the full ID card design. Check that the photo/logo URLs allow CORS, then try again.'
      );
    } finally {
      this.exportReady = false;
      this.downloading = false;
    }
  }

  private async buildExportValues(source: Record<string, string>): Promise<Record<string, string>> {
    const next: Record<string, string> = { ...source };
    const logoSrc = collegeLogoOrDefault(source['college.logo'] || DEFAULT_COLLEGE_LOGO_ASSET);
    const watermarkSrc = source['college.watermark'] || logoSrc;
    const photoSrc = source['student.photo'] || '';
    const sealSrc = source['college.seal'] || '';

    const [logoData, watermarkData, photoData, sealData] = await Promise.all([
      this.embedImageAsDataUrl(this.toUrl(logoSrc) || logoSrc),
      this.embedImageAsDataUrl(this.toUrl(watermarkSrc) || watermarkSrc),
      photoSrc ? this.embedImageAsDataUrl(photoSrc) : Promise.resolve(null),
      sealSrc ? this.embedImageAsDataUrl(this.toUrl(sealSrc) || sealSrc) : Promise.resolve(null)
    ]);

    if (logoData) {
      next['college.logo'] = logoData;
    }
    if (watermarkData) {
      next['college.watermark'] = watermarkData;
    } else if (logoData) {
      next['college.watermark'] = logoData;
    }
    if (photoData) {
      next['student.photo'] = photoData;
    }
    if (sealData) {
      next['college.seal'] = sealData;
    }
    return next;
  }

  private applyPreviewPayload(payload: any): void {
    const layout = parseCardLayout(payload.frontLayoutJson);
    const backLayout = parseCardLayout(payload.backLayoutJson);

    this.faceWidthMm = Number(payload.widthMm) || layout.widthMm;
    this.faceHeightMm = Number(payload.heightMm) || layout.heightMm;

    // Display fixes: drop Authorized Sign., stop Department label/value overlap.
    const frontClean = fixLabeledFieldOverlap(stripSignatureFromLayout(layout.elements).elements);
    const backClean = fixLabeledFieldOverlap(stripSignatureFromLayout(backLayout.elements).elements);
    this.faceElements = frontClean.elements;
    this.backElements = backClean.elements;

    const values = cardValuesFromStudentCard(payload);
    const logoHttp = this.toUrl(collegeLogoOrDefault(payload.logoPath));
    if (logoHttp) {
      values['college.logo'] = logoHttp;
      if (!values['college.watermark']) {
        values['college.watermark'] = logoHttp;
      }
    }
    const photoRaw = payload.photoPath || payload.PhotoPath;
    if (photoRaw) {
      // Cache-bust so a newly uploaded profile photo shows immediately on the ID card.
      const photoUrl = this.toUrl(photoRaw);
      values['student.photo'] = photoUrl
        ? `${photoUrl}${photoUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
        : photoUrl;
    }
    this.faceValues = { ...values };
    this.faceBackgroundUrl = payload.backgroundPath ? this.toUrl(payload.backgroundPath) : null;
    this.backBackgroundUrl = payload.backBackgroundPath
      ? this.toUrl(payload.backBackgroundPath)
      : this.faceBackgroundUrl;

    // Prefetch media as data URLs so on-screen + download stay consistent.
    void this.prefetchPreviewMedia(values);

    setTimeout(() => this.updatePreviewScale(), 0);
  }

  private async prefetchPreviewMedia(values: Record<string, string>): Promise<void> {
    const logoHttp = values['college.logo'];
    const photoHttp = values['student.photo'];
    const [logoData, photoData] = await Promise.all([
      logoHttp ? this.embedImageAsDataUrl(logoHttp) : Promise.resolve(null),
      photoHttp ? this.embedImageAsDataUrl(photoHttp) : Promise.resolve(null)
    ]);
    const next = { ...this.faceValues };
    let changed = false;
    if (logoData) {
      next['college.logo'] = logoData;
      next['college.watermark'] = next['college.watermark']?.startsWith('data:')
        ? next['college.watermark']
        : logoData;
      changed = true;
    }
    if (photoData) {
      next['student.photo'] = photoData;
      changed = true;
    }
    if (changed) {
      this.faceValues = next;
    }
  }

  private embedImageAsDataUrl(url: string): Promise<string | null> {
    if (!url) {
      return Promise.resolve(null);
    }
    if (url.startsWith('data:')) {
      return Promise.resolve(url);
    }
    // Absolute-ize relative SPA assets.
    const abs = /^https?:\/\//i.test(url) || url.startsWith('blob:')
      ? url
      : (url.startsWith('/') ? `${window.location.origin}${url}` : `${window.location.origin}/${url}`);

    return fetch(abs, { mode: 'cors', credentials: 'omit', cache: 'no-cache' })
      .then(res => {
        if (!res.ok) {
          throw new Error('fetch failed');
        }
        return res.blob();
      })
      .then(
        blob =>
          new Promise<string | null>(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || '') || null);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          })
      )
      .catch(() => this.embedImageViaCanvas(abs));
  }

  /** Fallback when fetch CORS fails — still needs the image server to send CORS headers. */
  private embedImageViaCanvas(url: string): Promise<string | null> {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  statusLabel(status: number | string): string {
    const map: Record<number, string> = {
      1: 'Draft', 2: 'Active', 3: 'Suspended', 4: 'Lost', 5: 'Expired', 6: 'Cancelled', 7: 'Replaced'
    };
    if (typeof status === 'number') {
      return map[status] || String(status);
    }
    return String(status || '');
  }

  private toUrl(path: string): string {
    return resolveCardMediaUrl(path, this.fileUrl);
  }
}
