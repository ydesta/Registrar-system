import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { FilesService } from 'src/app/services/files.service';
import { environment } from 'src/environments/environment';
import {
  CARD_BRAND,
  CARD_DESIGNER_PX_PER_MM,
  CARD_INK,
  CARD_SAMPLE_VALUES,
  CardPaletteItem,
  buildCardLayout,
  CARD_QR_CONTENT_OPTIONS,
  CARD_SCAN_LINK_PATH,
  classicBackStarterElements,
  classicStarterElements,
  createAlignedFieldRow,
  portraitVerticalBackStarterElements,
  portraitVerticalStarterElements,
  DEFAULT_COLLEGE_LOGO_ASSET,
  DEFAULT_QR_DATA_FIELDS,
  applyOptionalOverlays,
  ensureCurrentTermOnTitle,
  ensureHeaderLogo,
  stripSignatureFromLayout,
  stripGenderFromLayout,
  groupPalette,
  isLegacyBackLayout,
  isLegacyPhotoFrame,
  isLegacyPlainLayout,
  isPortraitVerticalLayout,
  stripOptionalOverlays,
  stripPortraitDetailsAccent,
  fixPortraitBackDateVisibility,
  nextAlignedFieldRowY,
  parseCardLayout,
  QR_DATA_FIELD_OPTIONS,
  resolveCardMediaUrl,
  shouldAddAsFieldRow,
  studentCardScanLink,
  upgradeAccentColors,
  upgradeCardSpacing,
  upgradePhotoFrame,
  upgradeQrToDataFields
} from './card-layout.model';
import { DesignElement, isLockedDesignElement } from './design-element.model';

@Component({
  selector: 'app-card-template-designer',
  templateUrl: './card-template-designer.component.html',
  styleUrls: ['./card-template-designer.component.scss']
})
export class CardTemplateDesignerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('stageHost') stageHost?: ElementRef<HTMLElement>;

  templateId: string | null = null;
  saving = false;
  loading = false;
  settingsOpen = true;
  inspectorOpen = true;
  palette: CardPaletteItem[] = [];
  paletteGroups: Array<{ group: string; items: CardPaletteItem[] }> = [];
  assets: any[] = [];
  cardTypes: any[] = [];
  activeSide: 'front' | 'back' = 'front';
  frontElements: DesignElement[] = [];
  backElements: DesignElement[] = [];
  selectedId: string | null = null;
  sample: Record<string, string> = {
    ...CARD_SAMPLE_VALUES,
    [CARD_SCAN_LINK_PATH]: studentCardScanLink(CARD_SAMPLE_VALUES['card.qrToken'])
  };
  readonly qrContentOptions = CARD_QR_CONTENT_OPTIONS;
  readonly qrDataFieldOptions = QR_DATA_FIELD_OPTIONS;
  /** Smart guides when the selection lines up with other fields. */
  alignGuides: Array<{ axis: 'x' | 'y'; mm: number }> = [];
  readonly pxPerMm = CARD_DESIGNER_PX_PER_MM;
  readonly brand = CARD_BRAND;
  private readonly alignToleranceMm = 0.2;
  fileUrl = environment.fileUrl;
  /** Auto-fitted so the full CR80 card stays visible in the live preview. */
  previewScale = 1;
  private fitScale = 1;
  private resizeObserver?: ResizeObserver;
  private alignGuideClearTimer: ReturnType<typeof setTimeout> | null = null;
  /** Natural width/height of the current college logo, keyed by image URL. */
  private readonly logoAspectCache = new Map<string, number>();

  form = this.fb.group({
    name: ['Student ID Card', Validators.required],
    description: [''],
    cardTypeId: [null as string | null, Validators.required],
    orientation: [2],
    widthMm: [85.6, Validators.required],
    heightMm: [53.98, Validators.required],
    isDefault: [true],
    isActive: [true],
    /** When off, card is front-only (back design kept but hidden from preview/print). */
    includeBack: [false],
    logoAssetId: [null as string | null],
    frontBackgroundAssetId: [null as string | null],
    backBackgroundAssetId: [null as string | null],
    /** Optional — only printed when company selects an asset. */
    watermarkAssetId: [null as string | null],
    sealAssetId: [null as string | null]
  });

  private dragMoveHandler: ((ev: MouseEvent) => void) | null = null;
  private dragUpHandler: (() => void) | null = null;
  private readonly historyMax = 60;
  private history: Array<{ front: DesignElement[]; back: DesignElement[]; selectedId: string | null }> = [];
  private historyIndex = -1;
  private historySuspended = false;
  private nudgeHistoryOpen = false;
  private nudgeHistoryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private crud: CrudService,
    private notify: CustomNotificationService,
    private files: FilesService,
    private route: ActivatedRoute,
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.templateId = this.route.snapshot.paramMap.get('id');
    this.crud.getList('/card-templates/palette').subscribe({
      next: (res: any) => {
        this.palette = res?.data || [];
        this.paletteGroups = groupPalette(this.palette);
      }
    });
    this.reloadAssets();
    this.crud.getList('/student-cards/types').subscribe({
      next: (res: any) => {
        this.cardTypes = res?.data || [];
        if (!this.templateId && this.cardTypes.length) {
          this.form.patchValue({ cardTypeId: this.cardTypes[0].id });
        }
      }
    });

    if (this.templateId) {
      this.loading = true;
      this.crud.getById('/card-templates', this.templateId).subscribe({
        next: (res: any) => {
          const t = res?.data;
          if (!t) {
            this.loading = false;
            return;
          }
          this.form.patchValue({
            name: t.name,
            description: t.description,
            cardTypeId: t.cardTypeId,
            orientation: t.orientation,
            widthMm: t.widthMm,
            heightMm: t.heightMm,
            isDefault: t.isDefault,
            isActive: t.isActive,
            includeBack: t.includeBack === true,
            logoAssetId: t.logoAssetId,
            frontBackgroundAssetId: t.frontBackgroundAssetId,
            backBackgroundAssetId: t.backBackgroundAssetId,
            watermarkAssetId: t.watermarkAssetId || null,
            sealAssetId: t.sealAssetId || null
          });
          this.frontElements = parseCardLayout(t.frontLayoutJson).elements;
          this.backElements = parseCardLayout(t.backLayoutJson).elements;
          if (!this.form.value.includeBack && this.activeSide === 'back') {
            this.activeSide = 'front';
          }
          // Compact / redesign upgrades (keeps chosen backgrounds unless full legacy wipe).
          if (isLegacyPlainLayout(this.frontElements)) {
            const hadV2 = (this.frontElements || []).some(e => e.id === 'layout-v2');
            this.frontElements = classicStarterElements();
            if (!hadV2) {
              this.backElements = classicBackStarterElements();
              this.form.patchValue({
                orientation: 2,
                widthMm: 85.6,
                heightMm: 53.98
              });
            }
            this.notify.notification(
              'info',
              'Layout upgraded',
              'Applied a tighter HiLCoE Service Request Card layout. Save to keep it.'
            );
          } else if (isLegacyPhotoFrame(this.frontElements)) {
            this.frontElements = upgradePhotoFrame(this.frontElements);
            this.notify.notification(
              'info',
              'Photo updated',
              'Applied a circular profile photo. Save to keep it.'
            );
          }
          if (isLegacyBackLayout(this.backElements)) {
            this.backElements = classicBackStarterElements();
            this.notify.notification(
              'info',
              'Back layout upgraded',
              'Applied a lighter academic record back design. Save to keep it.'
            );
          }
          const qrFront = upgradeQrToDataFields(this.frontElements);
          const qrBack = upgradeQrToDataFields(this.backElements);
          const portrait =
            isPortraitVerticalLayout(qrFront.elements) || isPortraitVerticalLayout(qrBack.elements);
          if (portrait) {
            // Keep optional vertical ID as designed — skip landscape header/spacing upgrades.
            this.frontElements = stripOptionalOverlays(stripPortraitDetailsAccent(qrFront.elements));
            const backFix = fixPortraitBackDateVisibility(qrBack.elements);
            this.backElements = backFix.elements;
            if (backFix.changed) {
              this.notify.notification(
                'info',
                'Back dates fixed',
                'Moved Joined / Expire above the blue wave so they stay readable. Save to keep it.'
              );
            }
          } else {
            const logoFront = ensureHeaderLogo(qrFront.elements);
            const spacedFront = upgradeCardSpacing(logoFront.elements);
            const noGenderFront = stripGenderFromLayout(spacedFront.elements);
            const termFront = ensureCurrentTermOnTitle(noGenderFront.elements);
            const noSigFront = stripSignatureFromLayout(termFront.elements);
            const accentFront = upgradeAccentColors(noSigFront.elements);
            const accentBack = upgradeAccentColors(qrBack.elements);
            // Strip any previously auto-injected overlays; settings control them.
            this.frontElements = stripOptionalOverlays(accentFront.elements);
            this.backElements = accentBack.elements;
            if (noGenderFront.changed) {
              this.notify.notification(
                'info',
                'Gender removed',
                'Gender was removed from this ID layout. Save to keep it.'
              );
            }
            if (logoFront.changed) {
              this.notify.notification(
                'info',
                'Header updated',
                'Applied a cleaner header with logo badge and brand styling. Save to keep it.'
              );
            }
            if (termFront.changed) {
              this.notify.notification(
                'info',
                'Current term added',
                'Added the current academic term on the title banner. Save to keep it.'
              );
            }
            if (noSigFront.changed) {
              this.notify.notification(
                'info',
                'Signature removed',
                'Authorized signature was removed from this ID layout. Save to keep it.'
              );
            }
          }
          this.syncOptionalOverlays();
          if (qrFront.changed || qrBack.changed) {
            this.notify.notification(
              'info',
              'QR updated',
              'QR now stores student and card details as text (not a website link). Save to keep this.'
            );
          }
          this.activeSide = 'front';
          this.syncSampleAssets(t);
          this.loading = false;
          this.resetHistory();
          this.scheduleFitPreview();
        },
        error: () => { this.loading = false; }
      });
    } else {
      this.frontElements = classicStarterElements();
      this.backElements = classicBackStarterElements();
      this.sample = { ...this.sample, 'college.logo': DEFAULT_COLLEGE_LOGO_ASSET };
      this.syncSampleFromForm();
      this.resetHistory();
    }
  }

  ngAfterViewInit(): void {
    this.observeStage();
    this.scheduleFitPreview();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.clearDragListeners();
    this.clearAlignGuides();
    if (this.nudgeHistoryTimer) {
      clearTimeout(this.nudgeHistoryTimer);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.fitPreviewToStage();
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    const target = event.target as HTMLElement | null;
    const tag = (target?.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || !!target?.isContentEditable;
    const mod = event.ctrlKey || event.metaKey;

    // Undo / redo work even while a field is selected; skip only when typing in inputs
    // except we still allow Ctrl+Z/U/Y from inputs if they are empty number fields — keep simple: allow when not typing text.
    if (mod && !event.altKey) {
      const k = key.toLowerCase();
      if (k === 'z' && !event.shiftKey) {
        if (typing && (tag === 'textarea' || (tag === 'input' && (target as HTMLInputElement).type === 'text'))) {
          return;
        }
        event.preventDefault();
        this.undo();
        return;
      }
      // Redo: Ctrl+Y, Ctrl+Shift+Z, or Ctrl+U (as requested)
      if (k === 'y' || k === 'u' || (k === 'z' && event.shiftKey)) {
        if (typing && (tag === 'textarea' || (tag === 'input' && (target as HTMLInputElement).type === 'text'))) {
          return;
        }
        event.preventDefault();
        this.redo();
        return;
      }
    }

    const arrows: Record<string, { dx: number; dy: number }> = {
      ArrowLeft: { dx: -1, dy: 0 },
      ArrowRight: { dx: 1, dy: 0 },
      ArrowUp: { dx: 0, dy: -1 },
      ArrowDown: { dx: 0, dy: 1 }
    };
    const dir = arrows[key];

    // Arrow keys move the selected card field even if focus is in X/Y number inputs.
    // Only skip when typing label text / free text.
    const typingLabel =
      tag === 'textarea' ||
      (tag === 'input' && ((target as HTMLInputElement).type || 'text') === 'text') ||
      !!target?.isContentEditable;

    if (dir) {
      if (typingLabel || tag === 'select') {
        return;
      }
      if (!this.selectedId) {
        return;
      }
      event.preventDefault();
      const step = event.shiftKey ? 1 : 0.1;
      this.nudgeSelected(dir.dx * step, dir.dy * step);
      return;
    }

    if (typing) {
      return;
    }
    if (!this.selectedId) {
      return;
    }

    if (key === 'Delete' || key === 'Backspace') {
      event.preventDefault();
      this.removeSelected();
    }
  }

  undo(): void {
    this.flushHistoryBatch();
    if (this.historyIndex <= 0) {
      return;
    }
    this.historyIndex -= 1;
    this.applyHistorySnapshot(this.history[this.historyIndex]);
  }

  redo(): void {
    this.flushHistoryBatch();
    if (this.historyIndex < 0 || this.historyIndex >= this.history.length - 1) {
      return;
    }
    this.historyIndex += 1;
    this.applyHistorySnapshot(this.history[this.historyIndex]);
  }

  private flushHistoryBatch(): void {
    if (!this.nudgeHistoryOpen && !this.nudgeHistoryTimer) {
      return;
    }
    if (this.nudgeHistoryTimer) {
      clearTimeout(this.nudgeHistoryTimer);
      this.nudgeHistoryTimer = null;
    }
    this.nudgeHistoryOpen = false;
    this.pushHistory();
  }

  private cloneElements(list: DesignElement[]): DesignElement[] {
    return JSON.parse(JSON.stringify(list || [])) as DesignElement[];
  }

  private pushHistory(): void {
    if (this.historySuspended) {
      return;
    }
    const snap = {
      front: this.cloneElements(this.frontElements),
      back: this.cloneElements(this.backElements),
      selectedId: this.selectedId
    };
    // Drop redo branch
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    const prev = this.history[this.history.length - 1];
    if (
      prev &&
      JSON.stringify(prev.front) === JSON.stringify(snap.front) &&
      JSON.stringify(prev.back) === JSON.stringify(snap.back)
    ) {
      return;
    }
    this.history.push(snap);
    if (this.history.length > this.historyMax) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
  }

  /** Seed / reset history after load or Apply classic. */
  private resetHistory(): void {
    this.history = [];
    this.historyIndex = -1;
    this.pushHistory();
  }

  private applyHistorySnapshot(snap: {
    front: DesignElement[];
    back: DesignElement[];
    selectedId: string | null;
  }): void {
    this.historySuspended = true;
    this.frontElements = this.cloneElements(snap.front);
    this.backElements = this.cloneElements(snap.back);
    this.selectedId = snap.selectedId;
    this.clearAlignGuides();
    this.historySuspended = false;
    this.cdr.detectChanges();
  }

  /** Groups rapid nudges / typing into one undo step (commits after idle). */
  private beginNudgeHistory(): void {
    this.nudgeHistoryOpen = true;
    if (this.nudgeHistoryTimer) {
      clearTimeout(this.nudgeHistoryTimer);
    }
    this.nudgeHistoryTimer = setTimeout(() => {
      this.nudgeHistoryOpen = false;
      this.nudgeHistoryTimer = null;
      this.pushHistory();
    }, 450);
  }

  get zoomPercent(): number {
    return Math.round(this.previewScale * 100);
  }

  private observeStage(): void {
    const el = this.stageHost?.nativeElement;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.fitPreviewToStage());
    this.resizeObserver.observe(el);
  }

  /** Fit the full CR80 card inside the stage (no horizontal clipping). */
  fitPreviewToStage(): void {
    const el = this.stageHost?.nativeElement;
    if (!el) {
      return;
    }
    const padX = 56;
    const padY = 72;
    const availW = Math.max(160, el.clientWidth - padX);
    const availH = Math.max(120, el.clientHeight - padY);
    const widthMm = Number(this.form.value.widthMm) || 85.6;
    const heightMm = Number(this.form.value.heightMm) || 53.98;
    const natW = widthMm * this.pxPerMm;
    const natH = heightMm * this.pxPerMm;
    const next = Math.min(availW / natW, availH / natH, 2.2);
    this.fitScale = Math.max(0.55, Math.round(next * 100) / 100);
    this.previewScale = this.fitScale;
  }

  scheduleFitPreview(): void {
    setTimeout(() => this.fitPreviewToStage(), 0);
    setTimeout(() => this.fitPreviewToStage(), 120);
  }

  zoomIn(): void {
    this.previewScale = Math.min(2.4, Math.round((this.previewScale + 0.1) * 100) / 100);
  }

  zoomOut(): void {
    this.previewScale = Math.max(0.45, Math.round((this.previewScale - 0.1) * 100) / 100);
  }

  zoomFit(): void {
    this.fitPreviewToStage();
  }

  get elements(): DesignElement[] {
    return this.activeSide === 'front' ? this.frontElements : this.backElements;
  }

  get selected(): DesignElement | null {
    return this.elements.find(e => e.id === this.selectedId) || null;
  }

  /** Images on the current side, so the right panel can list one and show its properties. */
  get cardImages(): DesignElement[] {
    return this.elements.filter(el => el.type === 'image');
  }

  imageCaption(el: DesignElement): string {
    if (el.sourcePath === 'college.logo') {
      return 'College logo';
    }
    if (el.sourcePath === 'student.photo') {
      return 'Photo';
    }
    if (el.sourcePath === 'college.seal') {
      return 'Seal';
    }
    if (el.sourcePath === 'college.watermark') {
      return 'Watermark';
    }
    return el.label || el.sourcePath || 'Image';
  }

  isLocked(el: DesignElement): boolean {
    return isLockedDesignElement(el);
  }

  /** Text shown as the editable label name in the inspector. */
  labelNameOf(el: DesignElement): string {
    if (el.type === 'staticText') {
      return el.staticText || '';
    }
    return el.label || '';
  }

  /** Persist label name — for static text this is what prints on the card. */
  setLabelName(el: DesignElement, value: string): void {
    if (isLockedDesignElement(el)) {
      return;
    }
    this.beginNudgeHistory();
    const next = value ?? '';
    if (el.type === 'staticText') {
      el.staticText = next;
      el.label = next || el.label || 'Label';
    } else {
      el.label = next;
    }
    this.touchElements();
  }

  /** Live-update X/Y/W/H (and other numeric props) for labels and values. */
  setElementNumber(
    el: DesignElement,
    key: 'xMm' | 'yMm' | 'wMm' | 'hMm' | 'fontSizePt',
    raw: number | string
  ): void {
    if (isLockedDesignElement(el) && (key === 'xMm' || key === 'yMm' || key === 'wMm' || key === 'hMm')) {
      return;
    }
    const n = typeof raw === 'number' ? raw : parseFloat(raw);
    if (!Number.isFinite(n)) {
      return;
    }
    this.beginNudgeHistory();
    const cardW = Number(this.form.value.widthMm) || 85.6;
    const cardH = Number(this.form.value.heightMm) || 53.98;
    if (key === 'xMm') {
      el.xMm = Math.max(0, Math.min(cardW - (el.wMm || 0), +n.toFixed(1)));
    } else if (key === 'yMm') {
      el.yMm = Math.max(0, Math.min(cardH - (el.hMm || 0), +n.toFixed(1)));
    } else if (key === 'wMm') {
      let width = Math.max(0.5, +n.toFixed(1));
      if (this.isCollegeLogo(el)) {
        width = this.clampLogoWidth(el, width);
        if (this.logoShapeOf(el) === 'circle') {
          el.hMm = width;
        }
      }
      el.wMm = width;
      if (
        el.type === 'image' &&
        el.imageFit === 'contain' &&
        !(this.isCollegeLogo(el) && this.logoShapeOf(el) === 'circle')
      ) {
        const aspect = this.cachedImageAspect(el);
        if (aspect) {
          this.applyFittedLogoBox(el, aspect);
        }
      }
    } else if (key === 'hMm') {
      let height = Math.max(0.5, +n.toFixed(1));
      if (this.isCollegeLogo(el) && this.logoShapeOf(el) === 'circle') {
        height = this.clampLogoWidth(el, height);
        el.wMm = height;
      }
      el.hMm = height;
    } else {
      el.fontSizePt = Math.max(4, +n.toFixed(1));
    }
    this.touchElements();
    this.refreshAlignGuides(el);
  }

  setElementProp(
    el: DesignElement,
    key: 'fontWeight' | 'color' | 'align' | 'fill',
    value: string
  ): void {
    if (isLockedDesignElement(el) && key === 'fill') {
      return;
    }
    this.beginNudgeHistory();
    (el as any)[key] = value;
    this.touchElements();
  }

  /** true when QR uses the field checklist instead of a single value. */
  isQrCustomDataMode(el: DesignElement): boolean {
    return !!(el.qrFields && el.qrFields.length);
  }

  qrContentPath(el: DesignElement): string {
    if (this.isQrCustomDataMode(el)) {
      return '';
    }
    return el.sourcePath || CARD_SCAN_LINK_PATH;
  }

  setQrMode(el: DesignElement, mode: 'link' | 'custom'): void {
    if (el.type !== 'qr') {
      return;
    }
    this.beginNudgeHistory();
    if (mode === 'custom') {
      el.qrFields = [...(el.qrFields?.length ? el.qrFields : DEFAULT_QR_DATA_FIELDS)];
      el.sourcePath = '';
    } else {
      el.qrFields = undefined;
      el.sourcePath = CARD_SCAN_LINK_PATH;
    }
    this.touchElements();
  }

  setQrContent(el: DesignElement, path: string): void {
    if (el.type !== 'qr') {
      return;
    }
    this.beginNudgeHistory();
    el.sourcePath = path || CARD_SCAN_LINK_PATH;
    el.qrFields = undefined;
    this.touchElements();
  }

  isQrFieldSelected(el: DesignElement, path: string): boolean {
    const fields = el.qrFields?.length ? el.qrFields : DEFAULT_QR_DATA_FIELDS;
    return fields.indexOf(path) >= 0;
  }

  toggleQrField(el: DesignElement, path: string, checked: boolean): void {
    if (el.type !== 'qr') {
      return;
    }
    this.beginNudgeHistory();
    const current = [...(el.qrFields?.length ? el.qrFields : DEFAULT_QR_DATA_FIELDS)];
    const idx = current.indexOf(path);
    if (checked && idx < 0) {
      current.push(path);
    } else if (!checked && idx >= 0) {
      current.splice(idx, 1);
    }
    el.qrFields = current;
    el.sourcePath = '';
    this.touchElements();
  }

  qrFieldsPreview(el: DesignElement): string {
    const fields = el.qrFields?.length ? el.qrFields : [];
    if (!fields.length) {
      return 'No fields selected';
    }
    return fields
      .map(p => QR_DATA_FIELD_OPTIONS.find(o => o.path === p)?.label || p)
      .join(' · ');
  }

  setQrLogo(el: DesignElement, enabled: boolean): void {
    if (el.type !== 'qr') {
      return;
    }
    this.beginNudgeHistory();
    el.qrLogo = !!enabled;
    this.touchElements();
  }

  /** College mark on the card (header or footer). Watermark and seal stay fixed. */
  isCollegeLogo(el: DesignElement): boolean {
    return el.type === 'image' && el.sourcePath === 'college.logo' && el.id !== 'watermark-logo';
  }

  logoShapeOf(el: DesignElement): 'circle' | 'rectangle' {
    return el.logoShape === 'rectangle' ? 'rectangle' : 'circle';
  }

  logoWidthMin(el: DesignElement): number {
    return this.logoShapeOf(el) === 'circle' ? 6 : 14;
  }

  /** Largest width that still sits on the card. Circles also stay inside the header band. */
  logoWidthMax(el: DesignElement): number {
    const cardW = Number(this.form.value.widthMm) || 85.6;
    const cardH = Number(this.form.value.heightMm) || 53.98;
    const right = Math.max(this.logoWidthMin(el), cardW - (el.xMm || 0) - 1.2);
    if (this.logoShapeOf(el) === 'circle') {
      const below = Math.max(6, cardH - (el.yMm || 0) - 0.8);
      const headerLimit = (el.yMm || 0) < 16 ? Math.max(6, 12.6 - (el.yMm || 0)) : below;
      return +Math.min(right, below, headerLimit, 18).toFixed(1);
    }
    return +Math.min(right, cardW - 1).toFixed(1);
  }

  setLogoShape(el: DesignElement, shape: 'circle' | 'rectangle'): void {
    if (!this.isCollegeLogo(el) || this.logoShapeOf(el) === shape) {
      return;
    }
    this.beginNudgeHistory();
    el.logoShape = shape;
    if (shape === 'circle') {
      const size = this.clampLogoWidth(el, Math.min(el.wMm || 9.8, el.hMm || 9.8));
      el.wMm = size;
      el.hMm = size;
    } else if (Math.abs((el.wMm || 0) - (el.hMm || 0)) < 1.5) {
      el.wMm = Math.min(this.logoWidthMax(el), Math.max(el.wMm || 0, 36));
    }
    this.touchElements();
  }

  setLogoWidth(el: DesignElement, raw: number | string): void {
    if (!this.isCollegeLogo(el)) {
      return;
    }
    const min = this.logoWidthMin(el);
    const max = Math.max(min, this.logoWidthMax(el));
    let n: number;
    if (raw === 'min') {
      n = min;
    } else if (raw === 'max') {
      n = max;
    } else {
      n = typeof raw === 'number' ? raw : parseFloat(String(raw));
    }
    if (!Number.isFinite(n)) {
      return;
    }
    this.beginNudgeHistory();
    const width = this.clampLogoWidth(el, n);
    el.wMm = width;
    if (this.logoShapeOf(el) === 'circle') {
      el.hMm = width;
      const cardH = Number(this.form.value.heightMm) || 53.98;
      if (el.yMm + el.hMm > cardH) {
        el.yMm = Math.max(0, +(cardH - el.hMm).toFixed(1));
      }
    } else if (el.imageFit === 'contain') {
      const aspect = this.cachedImageAspect(el);
      if (aspect) {
        this.applyFittedLogoBox(el, aspect);
      }
    }
    this.touchElements();
    this.refreshAlignGuides(el);
  }

  imageFitOf(el: DesignElement): 'contain' | 'cover' | 'fill' {
    return el.imageFit === 'cover' || el.imageFit === 'fill' ? el.imageFit : 'contain';
  }

  setImageFit(el: DesignElement, fit: 'contain' | 'cover' | 'fill'): void {
    if (el.type !== 'image' || el.imageFit === fit) {
      return;
    }
    this.beginNudgeHistory();
    el.imageFit = fit;
    this.touchElements();
    if (fit === 'contain') {
      this.fitLogoSize(el);
    }
  }

  /** Size the logo box to the image proportions at its current width. */
  fitLogoSize(el: DesignElement): void {
    if (el.type !== 'image') {
      return;
    }
    const id = el.id;
    this.measureLogoAspect(el).then(aspect => {
      const current = this.elements.find(e => e.id === id);
      if (!current || !aspect) {
        return;
      }
      this.beginNudgeHistory();
      if (!current.imageFit) {
        current.imageFit = 'contain';
      }
      this.applyFittedLogoBox(current, aspect);
      this.touchElements();
      this.refreshAlignGuides(current);
    });
  }

  private imageSourceUrl(el: DesignElement): string {
    if (el.sourcePath === 'college.logo') {
      return (this.sample['college.logo'] || this.logoPreviewUrl() || DEFAULT_COLLEGE_LOGO_ASSET).trim();
    }
    return (this.sample[el.sourcePath] || '').trim();
  }

  private cachedImageAspect(el: DesignElement): number | null {
    const src = this.imageSourceUrl(el);
    if (!src) {
      return null;
    }
    return this.logoAspectCache.get(src) ?? null;
  }

  private measureLogoAspect(el: DesignElement): Promise<number | null> {
    const src = this.imageSourceUrl(el);
    if (!src) {
      return Promise.resolve(null);
    }
    const cached = this.logoAspectCache.get(src);
    if (cached) {
      return Promise.resolve(cached);
    }
    return new Promise(resolve => {
      const img = new Image();
      if (!src.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (width > 0 && height > 0) {
          const aspect = width / height;
          this.logoAspectCache.set(src, aspect);
          resolve(aspect);
          return;
        }
        resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  /** Keep the whole image visible: height follows width, then shrink to stay on the card. */
  private applyFittedLogoBox(el: DesignElement, aspect: number): void {
    if (aspect <= 0) {
      return;
    }
    if (this.isCollegeLogo(el) && this.logoShapeOf(el) === 'circle') {
      const size = this.clampLogoWidth(el, el.wMm || 9.8);
      el.wMm = size;
      el.hMm = size;
      return;
    }
    const cardW = Number(this.form.value.widthMm) || 85.6;
    const cardH = Number(this.form.value.heightMm) || 53.98;
    const maxW = Math.max(4, +(cardW - (el.xMm || 0) - 0.8).toFixed(1));
    const maxH = Math.max(4, +(cardH - (el.yMm || 0) - 0.8).toFixed(1));
    const clampWidth = (value: number) =>
      this.isCollegeLogo(el)
        ? this.clampLogoWidth(el, value)
        : +Math.max(4, Math.min(maxW, value)).toFixed(1);
    let width = clampWidth(el.wMm || 36);
    let height = +(width / aspect).toFixed(1);
    if (height > maxH) {
      height = maxH;
      width = clampWidth(+(height * aspect).toFixed(1));
      height = +(width / aspect).toFixed(1);
    }
    el.wMm = width;
    el.hMm = +Math.min(maxH, Math.max(4, height)).toFixed(1);
  }

  private clampLogoWidth(el: DesignElement, width: number): number {
    const min = this.logoWidthMin(el);
    const max = Math.max(min, this.logoWidthMax(el));
    return +Math.max(min, Math.min(max, width)).toFixed(1);
  }

  private touchElements(): void {
    if (this.activeSide === 'front') {
      this.frontElements = this.frontElements.map(e => ({ ...e }));
    } else {
      this.backElements = this.backElements.map(e => ({ ...e }));
    }
    // Keep selection bound to the cloned object id.
    this.cdr.detectChanges();
  }

  get pageTitle(): string {
    return this.templateId ? 'Edit card template' : 'New card template';
  }

  setSide(side: 'front' | 'back'): void {
    if (side === 'back' && !this.form.value.includeBack) {
      this.activeSide = 'front';
      this.selectedId = null;
      this.clearAlignGuides();
      return;
    }
    this.activeSide = side;
    this.selectedId = null;
    this.clearAlignGuides();
  }

  onIncludeBackChanged(enabled: boolean): void {
    this.form.patchValue({ includeBack: !!enabled });
    if (!enabled) {
      this.activeSide = 'front';
      this.selectedId = null;
      this.clearAlignGuides();
      return;
    }
    if (!this.backElements?.length) {
      this.backElements = Number(this.form.value.orientation) === 1
        ? portraitVerticalBackStarterElements()
        : classicBackStarterElements();
      this.pushHistory();
    }
    this.activeSide = 'back';
  }

  guideStyle(g: { axis: 'x' | 'y'; mm: number }): Record<string, string> {
    const px = g.mm * this.pxPerMm * (this.previewScale || 1);
    if (g.axis === 'x') {
      return { left: `${px}px`, top: '0', bottom: '0', width: '1px' };
    }
    return { top: `${px}px`, left: '0', right: '0', height: '1px' };
  }

  private nudgeSelected(dxMm: number, dyMm: number): void {
    const el = this.elements.find(e => e.id === this.selectedId);
    if (!el) {
      return;
    }
    // Move the whole field row (label + value + underline) when possible.
    const group = this.findFieldRowGroup(el);
    const movers = (group
      ? [group.label, group.value, group.rule]
      : [el]
    ).filter((e): e is DesignElement => !!e);

    // Solo locked chrome cannot be nudged; row rules can move with the group.
    if (!group && isLockedDesignElement(el)) {
      return;
    }
    if (!movers.length) {
      return;
    }

    this.beginNudgeHistory();
    const cardW = Number(this.form.value.widthMm) || 85.6;
    const cardH = Number(this.form.value.heightMm) || 53.98;

    // Clamp using the group's bounding box so the row stays on the card.
    const minX = Math.min(...movers.map(m => m.xMm));
    const minY = Math.min(...movers.map(m => m.yMm));
    const maxX = Math.max(...movers.map(m => m.xMm + m.wMm));
    const maxY = Math.max(...movers.map(m => m.yMm + m.hMm));
    const width = maxX - minX;
    const height = maxY - minY;
    let applyDx = dxMm;
    let applyDy = dyMm;
    if (minX + applyDx < 0) {
      applyDx = -minX;
    }
    if (minY + applyDy < 0) {
      applyDy = -minY;
    }
    if (minX + width + applyDx > cardW) {
      applyDx = cardW - (minX + width);
    }
    if (minY + height + applyDy > cardH) {
      applyDy = cardH - (minY + height);
    }
    applyDx = +applyDx.toFixed(1);
    applyDy = +applyDy.toFixed(1);
    if (!applyDx && !applyDy) {
      return;
    }

    // Soft-snap using the primary selected element, then apply same delta to the row.
    const primary = group?.value || group?.label || el;
    const snapped = this.snapToGuides(
      primary,
      +(primary.xMm + applyDx).toFixed(1),
      +(primary.yMm + applyDy).toFixed(1)
    );
    const snapDx = +(snapped.xMm - primary.xMm).toFixed(1);
    const snapDy = +(snapped.yMm - primary.yMm).toFixed(1);

    movers.forEach(m => {
      m.xMm = +(m.xMm + snapDx).toFixed(1);
      m.yMm = +(m.yMm + snapDy).toFixed(1);
    });

    this.refreshAlignGuides(primary);
    this.scheduleAlignGuideClear();
    this.touchElements();
  }

  private snapToGuides(
    el: DesignElement,
    xMm: number,
    yMm: number
  ): { xMm: number; yMm: number } {
    const tol = this.alignToleranceMm;
    const others = this.elements.filter(o => o.id !== el.id && o.wMm > 0.05 && o.hMm > 0.05);
    const xLines: number[] = [];
    const yLines: number[] = [];
    others.forEach(o => {
      xLines.push(o.xMm, o.xMm + o.wMm / 2, o.xMm + o.wMm);
      yLines.push(o.yMm, o.yMm + o.hMm / 2, o.yMm + o.hMm);
    });

    let bestX = xMm;
    let bestDx = tol + 1;
    const candX = [xMm, xMm + el.wMm / 2, xMm + el.wMm];
    xLines.forEach(line => {
      candX.forEach((edge, i) => {
        const d = Math.abs(edge - line);
        if (d <= tol && d < bestDx) {
          bestDx = d;
          bestX = i === 0 ? line : i === 1 ? line - el.wMm / 2 : line - el.wMm;
        }
      });
    });

    let bestY = yMm;
    let bestDy = tol + 1;
    const candY = [yMm, yMm + el.hMm / 2, yMm + el.hMm];
    yLines.forEach(line => {
      candY.forEach((edge, i) => {
        const d = Math.abs(edge - line);
        if (d <= tol && d < bestDy) {
          bestDy = d;
          bestY = i === 0 ? line : i === 1 ? line - el.hMm / 2 : line - el.hMm;
        }
      });
    });

    return {
      xMm: +bestX.toFixed(1),
      yMm: +bestY.toFixed(1)
    };
  }

  private refreshAlignGuides(el: DesignElement): void {
    const tol = this.alignToleranceMm;
    const others = this.elements.filter(o => o.id !== el.id && o.wMm > 0.05 && o.hMm > 0.05);
    const guides: Array<{ axis: 'x' | 'y'; mm: number }> = [];
    const seen = new Set<string>();

    const add = (axis: 'x' | 'y', mm: number) => {
      const key = `${axis}:${mm.toFixed(1)}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      guides.push({ axis, mm: +mm.toFixed(1) });
    };

    const elEdgesX = [el.xMm, el.xMm + el.wMm / 2, el.xMm + el.wMm];
    const elEdgesY = [el.yMm, el.yMm + el.hMm / 2, el.yMm + el.hMm];

    others.forEach(o => {
      const oX = [o.xMm, o.xMm + o.wMm / 2, o.xMm + o.wMm];
      const oY = [o.yMm, o.yMm + o.hMm / 2, o.yMm + o.hMm];
      elEdgesX.forEach(ex => oX.forEach(ox => {
        if (Math.abs(ex - ox) <= tol) {
          add('x', ox);
        }
      }));
      elEdgesY.forEach(ey => oY.forEach(oy => {
        if (Math.abs(ey - oy) <= tol) {
          add('y', oy);
        }
      }));
    });

    this.alignGuides = guides;
  }

  private clearAlignGuides(): void {
    this.alignGuides = [];
    if (this.alignGuideClearTimer) {
      clearTimeout(this.alignGuideClearTimer);
      this.alignGuideClearTimer = null;
    }
  }

  private scheduleAlignGuideClear(): void {
    if (this.alignGuideClearTimer) {
      clearTimeout(this.alignGuideClearTimer);
    }
    this.alignGuideClearTimer = setTimeout(() => {
      this.alignGuides = [];
      this.alignGuideClearTimer = null;
    }, 900);
  }

  toggleSettings(): void {
    this.settingsOpen = !this.settingsOpen;
    this.scheduleFitPreview();
  }

  toggleInspector(): void {
    this.inspectorOpen = !this.inspectorOpen;
    this.scheduleFitPreview();
  }

  onOrientationChange(value: number): void {
    if (value === 1) {
      this.form.patchValue({ widthMm: 53.98, heightMm: 85.6 });
    } else {
      this.form.patchValue({ widthMm: 85.6, heightMm: 53.98 });
    }
    this.scheduleFitPreview();
  }

  get backgroundAssets(): any[] {
    const typed = (this.assets || []).filter(
      a => Number(a.assetType) === 2 || a.assetType === 'Background'
    );
    return typed.length ? typed : this.assets;
  }

  get logoAssets(): any[] {
    const typed = (this.assets || []).filter(
      a => Number(a.assetType) === 1 || a.assetType === 'Logo' || a.assetType == null
    );
    return typed.length ? typed : this.assets;
  }

  /** Watermark assets (type 4) — also allow picking from logos. */
  get watermarkAssets(): any[] {
    const typed = (this.assets || []).filter(
      a => Number(a.assetType) === 4 || a.assetType === 'Watermark'
    );
    return typed.length ? typed : this.logoAssets;
  }

  /** Seal / stamp assets (type 5) — also allow logos/icons. */
  get sealAssets(): any[] {
    const typed = (this.assets || []).filter(
      a =>
        Number(a.assetType) === 5 ||
        a.assetType === 'Seal' ||
        Number(a.assetType) === 3 ||
        a.assetType === 'Icon'
    );
    return typed.length ? typed : this.logoAssets;
  }

  backgroundUrl(): string | null {
    let id =
      this.activeSide === 'front'
        ? this.form.value.frontBackgroundAssetId
        : this.form.value.backBackgroundAssetId;
    // Back falls back to front background when none is set for the reverse.
    if (this.activeSide === 'back' && !id) {
      id = this.form.value.frontBackgroundAssetId;
    }
    const asset =
      this.backgroundAssets.find(a => a.id === id) ||
      this.assets.find(a => a.id === id);
    return asset?.filePath ? this.toUrl(asset.filePath) : null;
  }

  logoPreviewUrl(): string | null {
    const id = this.form.value.logoAssetId;
    const asset =
      this.logoAssets.find(a => a.id === id) ||
      this.assets.find(a => a.id === id);
    return asset?.filePath ? this.toUrl(asset.filePath) : null;
  }

  onBackgroundChanged(): void {
    // If front is set and back is empty, mirror front so both faces share the design.
    const frontId = this.form.value.frontBackgroundAssetId;
    const backId = this.form.value.backBackgroundAssetId;
    if (frontId && !backId) {
      this.form.patchValue({ backBackgroundAssetId: frontId }, { emitEvent: false });
    }
    setTimeout(() => this.cdr.markForCheck(), 0);
  }

  toUrl(path: string): string {
    return resolveCardMediaUrl(path, this.fileUrl);
  }

  reloadAssets(): void {
    this.crud.getList('/card-design-assets').subscribe({
      next: (res: any) => {
        this.assets = res?.data || [];
        this.syncSampleFromForm();
      }
    });
  }

  onLogoChanged(): void {
    // Let nz-select update the control first, then refresh sample logo on the canvas / QR.
    setTimeout(() => this.syncSampleFromForm(), 0);
  }

  onOptionalOverlayChanged(): void {
    setTimeout(() => {
      this.syncOptionalOverlays();
      this.syncSampleFromForm();
    }, 0);
  }

  /** Watermark / seal only appear when the company picks them in settings. */
  syncOptionalOverlays(): void {
    const watermark = !!this.form.value.watermarkAssetId;
    const seal = !!this.form.value.sealAssetId;
    const portrait = Number(this.form.value.orientation) === 1 || isPortraitVerticalLayout(this.frontElements);
    this.frontElements = applyOptionalOverlays(this.frontElements, { watermark, seal, portrait });
  }

  private assetUrlById(id: string | null | undefined): string | null {
    if (!id) {
      return null;
    }
    const asset = this.assets.find(a => a.id === id);
    return asset?.filePath ? this.toUrl(asset.filePath) : null;
  }

  private syncSampleAssets(t: any): void {
    const next = { ...this.sample };
    next['college.logo'] = this.toUrl(t.logoPath || DEFAULT_COLLEGE_LOGO_ASSET);
    next['college.watermark'] = t.watermarkPath ? this.toUrl(t.watermarkPath) : '';
    next['college.seal'] = t.sealPath ? this.toUrl(t.sealPath) : '';
    this.sample = next;
    this.syncSampleFromForm();
  }

  private syncSampleFromForm(): void {
    // Prefer template upload; otherwise always use assets/images/log.png
    const logo = this.logoPreviewUrl() || DEFAULT_COLLEGE_LOGO_ASSET;
    const watermark = this.assetUrlById(this.form.value.watermarkAssetId) || '';
    const seal = this.assetUrlById(this.form.value.sealAssetId) || '';
    this.embedImageAsDataUrl(logo).then(dataUrl => {
      this.sample = {
        ...this.sample,
        'college.logo': dataUrl || logo,
        'college.watermark': watermark,
        'college.seal': seal
      };
      this.cdr.detectChanges();
    });
  }

  private embedImageAsDataUrl(url: string): Promise<string | null> {
    if (!url || url.startsWith('data:')) {
      return Promise.resolve(url || null);
    }
    return fetch(url, { mode: 'cors', credentials: 'omit' })
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
      .catch(() => null);
  }

  addFromPalette(item: CardPaletteItem): void {
    this.addFromPaletteAt(
      item,
      5 + (this.elements.length % 5) * 2,
      12 + (this.elements.length % 6) * 4
    );
  }

  addShape(): void {
    this.addFromPalette({ label: 'Color band', type: 'shape', sourcePath: '', group: 'Layout' });
  }

  applyClassicStarter(): void {
    this.pushHistory();
    this.frontElements = classicStarterElements();
    this.backElements = classicBackStarterElements();
    this.form.patchValue({ orientation: 2, widthMm: 85.6, heightMm: 53.98, includeBack: false });
    this.syncOptionalOverlays();
    this.activeSide = 'front';
    this.selectedId = null;
    this.syncSampleFromForm();
    this.pushHistory();
    this.scheduleFitPreview();
    this.notify.notification(
      'success',
      'Classic starter',
      'HiLCoE Service Request Card (front only) applied. Turn on Include back side if needed, then Save.'
    );
  }

  /** Optional vertical school-ID style (does not replace the landscape starter). */
  applyPortraitVerticalStarter(): void {
    this.pushHistory();
    this.frontElements = portraitVerticalStarterElements();
    this.backElements = portraitVerticalBackStarterElements();
    this.form.patchValue({ orientation: 1, widthMm: 53.98, heightMm: 85.6, includeBack: false });
    this.syncOptionalOverlays();
    this.activeSide = 'front';
    this.selectedId = null;
    this.syncSampleFromForm();
    this.pushHistory();
    this.scheduleFitPreview();
    this.notify.notification(
      'success',
      'Portrait ID starter',
      'Professional vertical ID (front only) applied. Turn on Include back side if needed, then Save.'
    );
  }

  select(el: DesignElement): void {
    this.selectedId = el.id;
    this.clearAlignGuides();
  }

  removeSelected(): void {
    if (!this.selectedId) {
      return;
    }
    const el = this.elements.find(e => e.id === this.selectedId);
    if (!el || isLockedDesignElement(el)) {
      this.notify.notification('info', 'Locked', 'Layout chrome (borders / bands) cannot be deleted. Select a field first.');
      return;
    }
    this.pushHistory();
    if (this.activeSide === 'front') {
      this.frontElements = this.frontElements.filter(e => e.id !== this.selectedId);
    } else {
      this.backElements = this.backElements.filter(e => e.id !== this.selectedId);
    }
    this.selectedId = null;
    this.clearAlignGuides();
    this.pushHistory();
  }

  onElementMouseDown(payload: { el: DesignElement; event: MouseEvent }): void {
    const { el, event } = payload;
    if (isLockedDesignElement(el) || event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.clearDragListeners();
    this.selectedId = el.id;
    this.clearAlignGuides();

    const group = this.findFieldRowGroup(el);
    const movers = (group
      ? [group.label, group.value, group.rule]
      : [el]
    ).filter((m): m is DesignElement => !!m);
    const origins = movers.map(m => ({ id: m.id, xMm: m.xMm, yMm: m.yMm }));
    const primary = group?.value || group?.label || el;
    const startX = event.clientX;
    const startY = event.clientY;
    const cardW = Number(this.form.value.widthMm) || 85.6;
    const cardH = Number(this.form.value.heightMm) || 53.98;
    const scale = this.previewScale || 1;
    const minX0 = Math.min(...movers.map(m => m.xMm));
    const minY0 = Math.min(...movers.map(m => m.yMm));
    const width = Math.max(...movers.map(m => m.xMm + m.wMm)) - minX0;
    const height = Math.max(...movers.map(m => m.yMm + m.hMm)) - minY0;

    this.zone.runOutsideAngular(() => {
      this.dragMoveHandler = (ev: MouseEvent) => {
        let dx = (ev.clientX - startX) / (this.pxPerMm * scale);
        let dy = (ev.clientY - startY) / (this.pxPerMm * scale);
        if (minX0 + dx < 0) {
          dx = -minX0;
        }
        if (minY0 + dy < 0) {
          dy = -minY0;
        }
        if (minX0 + width + dx > cardW) {
          dx = cardW - (minX0 + width);
        }
        if (minY0 + height + dy > cardH) {
          dy = cardH - (minY0 + height);
        }
        this.zone.run(() => {
          const primaryOrig = origins.find(o => o.id === primary.id) || origins[0];
          const snapped = this.snapToGuides(
            primary,
            +(primaryOrig.xMm + dx).toFixed(1),
            +(primaryOrig.yMm + dy).toFixed(1)
          );
          const snapDx = +(snapped.xMm - primaryOrig.xMm).toFixed(1);
          const snapDy = +(snapped.yMm - primaryOrig.yMm).toFixed(1);
          movers.forEach(m => {
            const o = origins.find(x => x.id === m.id);
            if (!o) {
              return;
            }
            m.xMm = +(o.xMm + snapDx).toFixed(1);
            m.yMm = +(o.yMm + snapDy).toFixed(1);
          });
          this.refreshAlignGuides(primary);
          this.cdr.detectChanges();
        });
      };
      this.dragUpHandler = () => {
        this.clearDragListeners();
        this.zone.run(() => {
          this.pushHistory();
          this.scheduleAlignGuideClear();
        });
      };
      window.addEventListener('mousemove', this.dragMoveHandler, { passive: true });
      window.addEventListener('mouseup', this.dragUpHandler);
      window.addEventListener('blur', this.dragUpHandler);
    });
  }

  private clearDragListeners(): void {
    if (this.dragMoveHandler) {
      window.removeEventListener('mousemove', this.dragMoveHandler);
      this.dragMoveHandler = null;
    }
    if (this.dragUpHandler) {
      window.removeEventListener('mouseup', this.dragUpHandler);
      window.removeEventListener('blur', this.dragUpHandler);
      this.dragUpHandler = null;
    }
  }

  /** HTML5 drag from palette → drop onto card. */
  onPaletteDragStart(event: DragEvent, item: CardPaletteItem): void {
    if (!event.dataTransfer) {
      return;
    }
    event.dataTransfer.setData('application/x-card-palette', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
  }

  onCardDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onCardDrop(event: DragEvent): void {
    event.preventDefault();
    const raw = event.dataTransfer?.getData('application/x-card-palette');
    if (!raw) {
      return;
    }
    let item: CardPaletteItem;
    try {
      item = JSON.parse(raw);
    } catch {
      return;
    }
    const faceEl = (event.currentTarget as HTMLElement)?.querySelector('.card-face') as HTMLElement | null;
    const rect = (faceEl || (event.currentTarget as HTMLElement)).getBoundingClientRect();
    const scale = this.previewScale || 1;
    const xMm = Math.max(0, +((event.clientX - rect.left) / (this.pxPerMm * scale)).toFixed(1));
    const yMm = Math.max(0, +((event.clientY - rect.top) / (this.pxPerMm * scale)).toFixed(1));
    this.addFromPaletteAt(item, xMm, yMm);
  }

  addFromPaletteAt(item: CardPaletteItem, xMm: number, yMm: number): void {
    this.pushHistory();
    const cardW = Number(this.form.value.widthMm) || 85.6;
    const cardH = Number(this.form.value.heightMm) || 53.98;

    // Text data fields → full row (label + value + underline), same as Name/Class.
    if (shouldAddAsFieldRow(item)) {
      const rowTop = nextAlignedFieldRowY(this.elements, cardH);
      const row = createAlignedFieldRow({
        labelText: item.label,
        sourcePath: item.sourcePath,
        valueLabel: item.label,
        rowTopMm: rowTop
      });
      if (this.activeSide === 'front') {
        this.frontElements = [...this.frontElements, ...row];
      } else {
        this.backElements = [...this.backElements, ...row];
      }
      this.selectedId = row.find(e => e.type === 'text')?.id || row[0].id;
      this.pushHistory();
      return;
    }

    const id = `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const isMedia = item.type === 'qr' || item.type === 'image';
    const wMm = isMedia ? 16 : item.type === 'shape' ? 30 : 35;
    const hMm = isMedia ? 16 : item.type === 'shape' ? 8 : 5;
    const el: DesignElement = {
      id,
      type: item.type || 'text',
      sourcePath: item.type === 'qr' ? '' : (item.sourcePath || ''),
      label: item.label,
      xMm: Math.max(0, Math.min(cardW - wMm, xMm)),
      yMm: Math.max(0, Math.min(cardH - hMm, yMm)),
      wMm,
      hMm,
      fontSizePt: 7.5,
      fontWeight: 'normal',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: CARD_INK,
      fill: item.type === 'shape' ? CARD_BRAND : undefined,
      staticText: item.type === 'staticText' ? 'Text' : undefined,
      qrFields: item.type === 'qr' ? [...DEFAULT_QR_DATA_FIELDS] : undefined,
      qrLogo: item.type === 'qr' ? true : undefined
    };
    if (this.activeSide === 'front') {
      this.frontElements = [...this.frontElements, el];
    } else {
      this.backElements = [...this.backElements, el];
    }
    this.selectedId = id;
    this.pushHistory();
  }

  /** Copy selected field row (label + value + underline) as the next aligned row. */
  duplicateSelectedFieldRow(): void {
    const el = this.selected;
    if (!el) {
      return;
    }
    const group = this.findFieldRowGroup(el);
    if (!group) {
      this.notify.notification(
        'info',
        'Select a field row',
        'Select a label or value (e.g. Name / Gender) to duplicate its layout.'
      );
      return;
    }
    this.pushHistory();
    const cardH = Number(this.form.value.heightMm) || 53.98;
    const rowTop = nextAlignedFieldRowY(this.elements, cardH);
    const labelText =
      group.label?.staticText ||
      group.label?.label ||
      group.value?.label ||
      'Label';
    const sourcePath = group.value?.sourcePath || '';
    if (!sourcePath) {
      this.notify.notification('info', 'Cannot copy', 'This row has no bound value to duplicate.');
      return;
    }
    const row = createAlignedFieldRow({
      labelText,
      sourcePath,
      valueLabel: group.value?.label || labelText,
      rowTopMm: rowTop
    });
    if (this.activeSide === 'front') {
      this.frontElements = [...this.frontElements, ...row];
    } else {
      this.backElements = [...this.backElements, ...row];
    }
    this.selectedId = row.find(e => e.type === 'text')?.id || row[0].id;
    this.pushHistory();
  }

  private findFieldRowGroup(el: DesignElement): {
    label?: DesignElement;
    value?: DesignElement;
    rule?: DesignElement;
  } | null {
    const id = el.id || '';
    const prefix =
      id.replace(/-label$|-value$|-rule$/, '') ||
      (el.type === 'text' || el.type === 'staticText' ? id : '');
    const byPrefix = (suffix: string) =>
      this.elements.find(e => e.id === `${prefix}-${suffix}` || e.id === `${prefix}${suffix}`);

    // New dynamic rows: field-…-label / -value / -rule
    if (/-label$|-value$|-rule$/.test(id)) {
      return {
        label: byPrefix('label') || (el.type === 'staticText' ? el : undefined),
        value: byPrefix('value') || (el.type === 'text' ? el : undefined),
        rule: byPrefix('rule')
      };
    }

    // Classic starter ids: name / name-label / name-rule
    const classic = ['name', 'class', 'src', 'tel'].find(
      key => id === key || id === `${key}-label` || id === `${key}-rule`
    );
    if (classic) {
      return {
        label: this.elements.find(e => e.id === `${classic}-label`),
        value: this.elements.find(e => e.id === classic),
        rule: this.elements.find(e => e.id === `${classic}-rule`)
      };
    }

    // Fallback: nearest label + rule by Y for a free text value
    if (el.type === 'text' && el.sourcePath) {
      const label = this.elements
        .filter(e => e.type === 'staticText' && Math.abs(e.yMm - el.yMm) < 1.2)
        .sort((a, b) => Math.abs(a.yMm - el.yMm) - Math.abs(b.yMm - el.yMm))[0];
      const rule = this.elements
        .filter(
          e =>
            e.type === 'shape' &&
            (e.id || '').includes('rule') &&
            Math.abs(e.yMm - (el.yMm + 3)) < 2
        )
        .sort((a, b) => Math.abs(a.yMm - el.yMm) - Math.abs(b.yMm - el.yMm))[0];
      return { label, value: el, rule };
    }
    return null;
  }

  registerAsset(path: string, type: number): void {
    if (!path) return;
    this.crud.add('/card-design-assets', {
      name: path.split('/').pop() || 'Asset',
      assetType: type,
      filePath: path
    }).subscribe({
      next: (res: any) => {
        if (res?.status === 'success') {
          this.notify.notification('success', 'Success', 'Asset registered');
          this.reloadAssets();
        }
      }
    });
  }

  onAssetUpload(event: Event, assetType: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.files.uploadFile({ target: input }, 'card-design').subscribe({
      next: (res: any) => {
        const path = this.resolveUploadPath(res);
        const fileId = res?.data?.id || res?.data?.fileId;
        if (path) {
          this.crud.add('/card-design-assets', {
            name: input.files![0].name,
            assetType,
            filePath: path,
            fileId
          }).subscribe({
            next: (r: any) => {
              if (r?.status === 'success' || r?.status === 'succes') {
                this.notify.notification('success', 'Success', 'Asset uploaded');
                this.reloadAssets();
                if (r?.data?.id) {
                  if (assetType === 1) {
                    this.form.patchValue({ logoAssetId: r.data.id });
                    this.onLogoChanged();
                  } else if (assetType === 2) {
                    if (this.activeSide === 'back') {
                      this.form.patchValue({ backBackgroundAssetId: r.data.id });
                    } else {
                      this.form.patchValue({
                        frontBackgroundAssetId: r.data.id,
                        backBackgroundAssetId: this.form.value.backBackgroundAssetId || r.data.id
                      });
                    }
                    this.onBackgroundChanged();
                  } else if (assetType === 4) {
                    this.form.patchValue({ watermarkAssetId: r.data.id });
                    this.onOptionalOverlayChanged();
                  } else if (assetType === 5) {
                    this.form.patchValue({ sealAssetId: r.data.id });
                    this.onOptionalOverlayChanged();
                  }
                }
              } else {
                this.notify.notification('error', 'Error', r?.data || r?.error || 'Asset register failed');
              }
            },
            error: () => this.notify.notification('error', 'Error', 'Asset register failed')
          });
        } else {
          this.notify.notification('error', 'Error', 'Upload did not return a path');
        }
      },
      error: () => this.notify.notification('error', 'Error', 'Upload failed')
    });
  }

  /** Prefer API path; fall back to legacy FileData shapes used elsewhere in the app. */
  private resolveUploadPath(res: any): string | null {
    const d = res?.data;
    if (!d) {
      return null;
    }
    if (typeof d === 'string' && d.trim()) {
      return d.trim();
    }
    const direct = d.path || d.filePath || d.fileName;
    if (typeof direct === 'string' && direct.trim()) {
      const p = direct.trim();
      return p.includes('/') || p.includes('\\') ? p.replace(/\\/g, '/') : `Resources/Files/${p}`;
    }
    const nestedName = d.data?.fileName || d.Data?.fileName || d.data?.FileName;
    if (typeof nestedName === 'string' && nestedName.trim()) {
      return `Resources/Files/${nestedName.trim()}`;
    }
    return null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.settingsOpen = true;
      return;
    }
    const orientation = this.form.value.orientation || 2;
    const widthMm = this.form.value.widthMm || 85.6;
    const heightMm = this.form.value.heightMm || 53.98;
    const frontLayout = buildCardLayout(orientation, widthMm, heightMm, this.frontElements);
    const backLayout = buildCardLayout(orientation, widthMm, heightMm, this.backElements);
    const body = {
      id: this.templateId,
      cardTypeId: this.form.value.cardTypeId,
      name: this.form.value.name,
      description: this.form.value.description,
      orientation,
      widthMm,
      heightMm,
      frontLayoutJson: JSON.stringify(frontLayout),
      backLayoutJson: JSON.stringify(backLayout),
      includeBack: this.form.value.includeBack === true,
      logoAssetId: this.form.value.logoAssetId,
      frontBackgroundAssetId: this.form.value.frontBackgroundAssetId,
      backBackgroundAssetId:
        this.form.value.backBackgroundAssetId || this.form.value.frontBackgroundAssetId,
      watermarkAssetId: this.form.value.watermarkAssetId || null,
      sealAssetId: this.form.value.sealAssetId || null,
      isDefault: this.form.value.isDefault,
      isActive: this.form.value.isActive
    };
    this.saving = true;
    this.crud.add('/card-templates', body).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res?.status === 'success') {
          this.notify.notification('success', 'Success', 'Template saved');
          const id = res?.data?.result?.id || res?.data?.id || this.templateId;
          if (id && !this.templateId) {
            this.router.navigateByUrl(`/students/card-template-designer/${id}`);
            this.templateId = id;
          }
        } else {
          this.notify.notification('error', 'Error', res?.data || 'Save failed');
        }
      },
      error: (err) => {
        this.saving = false;
        this.notify.notification('error', 'Error', err?.error?.data || 'Save failed');
      }
    });
  }
}
