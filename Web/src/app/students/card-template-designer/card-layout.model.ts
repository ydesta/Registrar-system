import { DesignElement } from './design-element.model';

export interface CardLayoutDocument {
  version: number;
  orientation: 'Portrait' | 'Landscape';
  widthMm: number;
  heightMm: number;
  elements: DesignElement[];
}

export interface CardPaletteItem {
  label: string;
  type: string;
  sourcePath: string;
  group: string;
}

export const CARD_DESIGNER_PX_PER_MM = 3.78;

/** HiLCoE service-request blue (from physical card). */
export const CARD_BRAND = '#1B4F9C';
export const CARD_BRAND_DARK = '#0E2F66';
export const CARD_INK = '#0F274F';
export const CARD_MUTED = '#5B6B86';
export const CARD_ACCENT = '#1B4F9C';
export const CARD_SURFACE = '#F4F7FC';
export const CARD_LINE = '#9BB0D4';
/** Logo-inspired red accent (a bit stronger). */
export const CARD_GOLD = '#C94A4A';
export const CARD_ACCENT_RED = '#C94A4A';

export const CARD_QR_TOKEN_PATH = 'card.qrToken';
export const CARD_SCAN_LINK_PATH = 'card.scanLink';

/** Single-value QR choices (verification link or one field). */
export const CARD_QR_CONTENT_OPTIONS: ReadonlyArray<{ label: string; path: string }> = [
  { label: 'Verification link', path: CARD_SCAN_LINK_PATH },
  { label: 'Card token', path: CARD_QR_TOKEN_PATH },
  { label: 'Card number', path: 'card.cardNumber' },
  { label: 'Student ID', path: 'student.studentNumber' },
  { label: 'Full name', path: 'student.fullName' },
  { label: 'Website', path: 'college.web' }
];

/** Fields available when QR mode = selected fields. */
export const QR_DATA_FIELD_OPTIONS: ReadonlyArray<{ path: string; label: string; group: string }> = [
  { path: 'student.fullName', label: 'Full name', group: 'Student' },
  { path: 'student.fullNameAmharic', label: 'Name (Amharic)', group: 'Student' },
  { path: 'student.studentNumber', label: 'Student ID', group: 'Student' },
  { path: 'student.entryYear', label: 'Entry year', group: 'Student' },
  { path: 'student.department', label: 'Department (Programme)', group: 'Student' },
  { path: 'student.programme', label: 'Programme', group: 'Student' },
  { path: 'student.class', label: 'Class', group: 'Student' },
  { path: 'student.batch', label: 'Batch', group: 'Student' },
  { path: 'student.phone', label: 'Phone', group: 'Student' },
  { path: 'student.email', label: 'Email', group: 'Student' },
  { path: 'student.guardian', label: 'Guardian', group: 'Student' },
  { path: 'student.emergencyPhone', label: 'Emergency call', group: 'Student' },
  { path: 'student.nationality', label: 'Nationality', group: 'Student' },
  { path: 'student.birthDate', label: 'Birth date', group: 'Student' },
  { path: 'card.cardNumber', label: 'Card number', group: 'Card' },
  { path: 'card.issuedAt', label: 'Issue date', group: 'Card' },
  { path: 'card.expiresAt', label: 'Expiry date', group: 'Card' },
  { path: 'card.title', label: 'Card title', group: 'Card' },
  { path: 'card.currentTerm', label: 'Current term', group: 'Card' },
  { path: 'college.shortName', label: 'Short name', group: 'College' },
  { path: 'college.name', label: 'College name', group: 'College' },
  { path: 'college.web', label: 'Website', group: 'College' },
  { path: 'college.phone', label: 'Phone', group: 'College' },
  { path: 'college.email', label: 'Email', group: 'College' }
];

/**
 * Keep this list short — a ~15mm QR cannot carry many fields and still scan
 * reliably (especially with a center logo).
 */
export const DEFAULT_QR_DATA_FIELDS: string[] = [
  'student.fullName',
  'student.studentNumber',
  'student.class',
  'card.cardNumber',
  'card.expiresAt',
  'college.shortName'
];

/** Build public verification URL encoded in the QR (only useful with a public site URL). */
export function studentCardScanLink(token: string | null | undefined): string {
  if (!token) {
    return '';
  }
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/card-scan/${encodeURIComponent(token)}`;
}

export function buildQrDataPayload(
  qrFields: string[] | null | undefined,
  values: Record<string, string>
): string {
  const fields = (qrFields && qrFields.length ? qrFields : DEFAULT_QR_DATA_FIELDS).filter(Boolean);
  // Short labels → fewer QR modules → easier to scan on a small card.
  const shortLabel: Record<string, string> = {
    'student.fullName': 'Name',
    'student.fullNameAmharic': 'Name (AM)',
    'student.studentNumber': 'ID',
    'student.entryYear': 'Entry',
    'student.department': 'Dept',
    'student.programme': 'Prog',
    'student.class': 'Class',
    'student.batch': 'Batch',
    'student.phone': 'Tel',
    'card.cardNumber': 'Card',
    'card.issuedAt': 'Issued',
    'card.expiresAt': 'Expires',
    'card.title': 'Title',
    'card.currentTerm': 'Term',
    'college.shortName': 'College',
    'college.name': 'College',
    'college.web': 'Web',
    'college.phone': 'College tel',
    'college.email': 'Email'
  };
  const lines: string[] = [];
  fields.forEach(path => {
    const value = (values[path] || '').trim();
    if (!value) {
      return;
    }
    const label = shortLabel[path] || QR_DATA_FIELD_OPTIONS.find(o => o.path === path)?.label || path;
    lines.push(`${label}: ${value}`);
  });
  return lines.join('\n');
}

/** Resolve QR payload: selected fields (default), or a single source path / link. */
export function resolveQrPayload(
  el: { sourcePath?: string; qrFields?: string[]; staticText?: string },
  values: Record<string, string>
): string {
  if (el.qrFields && el.qrFields.length > 0) {
    return buildQrDataPayload(el.qrFields, values);
  }
  // Empty / missing source → pack default student card data (not a localhost link).
  if (!el.sourcePath || el.sourcePath === 'card.qr' || el.sourcePath === 'qr') {
    return buildQrDataPayload(DEFAULT_QR_DATA_FIELDS, values);
  }
  const path = el.sourcePath;
  if (path && values[path]) {
    return values[path];
  }
  return el.staticText || buildQrDataPayload(DEFAULT_QR_DATA_FIELDS, values);
}

/** Shared geometry for Name / Class / SRC / Batch / Dept label + value + underline rows. */
export const FIELD_ROW_LAYOUT = {
  labelX: 3.2,
  labelW: 14.0,
  valueX: 17.6,
  valueW: 45.5,
  rowH: 4.2,
  labelH: 2.9,
  valueH: 3.1,
  ruleH: 0.22,
  ruleOffsetY: 3.0,
  labelFontPt: 5.8,
  valueFontPt: 7.1,
  defaultTop: 19.4
} as const;

const FONT = 'Segoe UI, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

/**
 * Default college mark — file:
 * Web/src/assets/images/log.png  → served as assets/images/log.png
 */
export const DEFAULT_COLLEGE_LOGO_ASSET = 'assets/images/log.png';

/**
 * Tiny PNG placeholders (Angular blocks data:image/svg+xml as unsafe).
 * 1x1 light-blue / white pixels — real photo comes from uploads.
 */
export const CARD_SAMPLE_PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export const CARD_SAMPLE_LOGO = DEFAULT_COLLEGE_LOGO_ASSET;

/** Resolve card media: frontend assets stay on the SPA host; uploads use the API file host. */
export function resolveCardMediaUrl(
  path: string | null | undefined,
  fileBaseUrl: string
): string {
  const value = (path || '').trim();
  if (!value) {
    return '';
  }
  if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }
  // App static files (do not prefix API fileUrl) — e.g. assets/images/log.png
  if (value.startsWith('assets/') || value.startsWith('./assets/')) {
    return value.replace(/^\.\//, '');
  }
  if (value.startsWith('/assets/')) {
    return value.slice(1);
  }
  return `${fileBaseUrl}${value.startsWith('/') ? '' : '/'}${value}`;
}

/** Prefer uploaded logo path; otherwise the bundled log.png. */
export function collegeLogoOrDefault(logoPath: string | null | undefined): string {
  const value = (logoPath || '').trim();
  return value || DEFAULT_COLLEGE_LOGO_ASSET;
}

export const CARD_SAMPLE_VALUES: Record<string, string> = {
  'student.fullName': 'Abebe Kebede Alemu',
  'student.fullNameAmharic': 'አበበ ከበደ አለሙ',
  'student.studentNumber': 'SRC/2024/000001',
  'student.entryYear': '2024',
  'student.department': 'Computer Science',
  'student.programme': 'Computer Science',
  'student.class': 'CS Year 2',
  'student.batch': '2024',
  'student.phone': '+251 91 234 5678',
  'student.email': 'abebe.kebede@example.com',
  'student.nationality': 'Ethiopian',
  'student.birthDate': '2002-05-14',
  'student.guardian': 'Kebede Alemu',
  'student.emergencyPhone': '+251 91 234 5678',
  'student.curriculum': 'CS-2024',
  // Empty → CSS PHOTO placeholder (avoids Angular/CSP svg data-uri issues)
  'student.photo': '',
  'card.cardNumber': 'SRC-2026-000001',
  'card.issuedAt': '2026-10-31',
  'card.expiresAt': '2027-10-31',
  'card.qrToken': 'CS1.SAMPLE.TOKEN',
  'card.scanLink': 'http://localhost:4200/card-scan/CS1.SAMPLE.TOKEN',
  'card.title': 'Service Request Card',
  'card.currentTerm': 'Autumn 2026',
  'college.name': 'HiLCoE School of Computer Science & Technology',
  'college.shortName': 'HiLCoE',
  'college.tagline': 'School of Computer Science & Technology',
  'college.phone': '+251-11-156 4888, 127 5026',
  'college.email': 'info@hilcoeschool.net',
  'college.web': 'www.hilcoeschool.com',
    'college.logo': DEFAULT_COLLEGE_LOGO_ASSET,
    'college.watermark': '',
    'college.seal': '',
  // Academic service record rows stay blank until registrar fills them.
  'back.term1': '',
  'back.courses1': '',
  'back.remark1': '',
  'back.term2': '',
  'back.courses2': '',
  'back.remark2': ''
};

export function parseCardLayout(json: string | null | undefined): CardLayoutDocument {
  try {
    const parsed = JSON.parse(json || '{}');
    return {
      version: parsed.version || 1,
      orientation: parsed.orientation === 'Portrait' ? 'Portrait' : 'Landscape',
      widthMm: Number(parsed.widthMm) || 85.6,
      heightMm: Number(parsed.heightMm) || 53.98,
      elements: Array.isArray(parsed.elements) ? parsed.elements : []
    };
  } catch {
    return {
      version: 1,
      orientation: 'Landscape',
      widthMm: 85.6,
      heightMm: 53.98,
      elements: []
    };
  }
}

export function buildCardLayout(
  orientation: number,
  widthMm: number,
  heightMm: number,
  elements: DesignElement[]
): CardLayoutDocument {
  return {
    version: 1,
    orientation: orientation === 1 ? 'Portrait' : 'Landscape',
    widthMm,
    heightMm,
    elements
  };
}

export function resolveElementText(el: DesignElement, values: Record<string, string>): string {
  if (el.type === 'shape') return '';
  if (el.type === 'staticText') return el.staticText || 'Text';
  if (el.type === 'qr') return 'QR';
  if (el.type === 'barcode') return values[el.sourcePath] || 'CARD';
  if (el.type === 'image') return el.label || 'IMG';
  const raw = values[el.sourcePath];
  if (raw != null && String(raw).trim() !== '') {
    return String(raw);
  }
  // Academic service record: never show designer labels as fake content.
  if (/^back\.(term|courses|remark)\d+$/i.test(el.sourcePath || '')) {
    return '';
  }
  return el.label || el.sourcePath || '';
}

/** Read camelCase or PascalCase fields from API payloads. */
export function cardField(card: any, ...keys: string[]): string {
  if (!card) {
    return '';
  }
  for (const key of keys) {
    const direct = card[key];
    if (direct != null && String(direct).trim() !== '') {
      return String(direct).trim();
    }
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    const alt = card[pascal];
    if (alt != null && String(alt).trim() !== '') {
      return String(alt).trim();
    }
  }
  return '';
}

export function cardValuesFromStudentCard(card: any, collegeName = 'HiLCoE School of Computer Science & Technology'): Record<string, string> {
  const programmeCode = cardField(card, 'academicProgrammeCode');
  const department = cardField(card, 'department') || programmeCode;
  const entryYear = cardField(card, 'entryYear');
  const batch = cardField(card, 'batchCode', 'offerBatchCode');
  const phone = cardField(card, 'phone', 'mobile');
  const qrToken = cardField(card, 'qrToken');
  const issuedAt = cardField(card, 'issuedAt');
  const expiresAt = cardField(card, 'expiresAt');
  const birthDate = cardField(card, 'birthDate');
  return {
    'student.fullName': cardField(card, 'fullName'),
    'student.fullNameAmharic': cardField(card, 'fullNameAmharic'),
    'student.studentNumber': cardField(card, 'studentNumber'),
    'student.entryYear': entryYear,
    'student.department': department,
    'student.programme': department || programmeCode,
    // Class = programme code only — do not append batch (Batch and Dept are separate rows).
    'student.class': programmeCode || department,
    'student.batch': batch,
    'student.curriculum': cardField(card, 'curriculumCode'),
    'student.phone': phone,
    'student.email': cardField(card, 'email'),
    'student.nationality': cardField(card, 'nationality'),
    'student.birthDate': birthDate ? birthDate.slice(0, 10) : '',
    'student.guardian': cardField(card, 'guardianName', 'fatherName', 'guardian'),
    'student.emergencyPhone': cardField(card, 'emergencyPhone') || phone,
    'student.photo': cardField(card, 'photoPath', 'photoUrl'),
    'card.cardNumber': cardField(card, 'cardNumber'),
    'card.issuedAt': issuedAt ? issuedAt.slice(0, 10) : '',
    'card.expiresAt': expiresAt ? expiresAt.slice(0, 10) : '',
    'card.qrToken': qrToken,
    'card.scanLink': studentCardScanLink(qrToken),
    'card.title': 'Service Request Card',
    'card.currentTerm': cardField(card, 'currentTerm'),
    'college.name': cardField(card, 'collegeName') || collegeName,
    'college.shortName': 'HiLCoE',
    'college.tagline': 'School of Computer Science & Technology',
    'college.phone': '+251-11-156 4888, 127 5026',
    'college.email': 'info@hilcoeschool.net',
    'college.web': 'www.hilcoeschool.com',
    'college.logo': collegeLogoOrDefault(cardField(card, 'logoPath') || card?.logoPath),
    'college.watermark': cardField(card, 'watermarkPath'),
    'college.seal': cardField(card, 'sealPath'),
    // Keep service-record cells empty until academic data is supplied.
    'back.term1': cardField(card, 'backTerm1', 'term1') || '',
    'back.courses1': cardField(card, 'backCourses1', 'courses1') || '',
    'back.remark1': cardField(card, 'backRemark1', 'remark1') || '',
    'back.term2': cardField(card, 'backTerm2', 'term2') || '',
    'back.courses2': cardField(card, 'backCourses2', 'courses2') || '',
    'back.remark2': cardField(card, 'backRemark2', 'remark2') || ''
  };
}

/** True when layout is not a known current starter (landscape v5h or portrait vertical). */
export function isLegacyPlainLayout(elements: DesignElement[]): boolean {
  if (!elements?.length) {
    return true;
  }
  return !elements.some(
    e =>
      e.id === 'layout-v5h' ||
      e.id === 'layout-portrait-v1' ||
      e.id === 'layout-portrait-v2' ||
      e.id === 'layout-portrait-back-v1' ||
      e.id === 'layout-portrait-back-v2'
  );
}

/**
 * SRC gap + keep QR clearly below the photo (never tucked under it).
 */
export function upgradeCardSpacing(elements: DesignElement[]): { elements: DesignElement[]; changed: boolean } {
  if (isPortraitVerticalLayout(elements)) {
    return { elements: elements || [], changed: false };
  }
  const list = (elements || []).filter(e => e.id !== 'layout-v5f');
  let changed = list.length !== (elements || []).length;
  let next = [...list];

  const srcRule = next.find(e => e.id === 'src-rule');
  const telLabel = next.find(e => e.id === 'tel-label');

  // Push Tel / Gender / Batch down if they sit too close under SRC.
  if (srcRule && telLabel) {
    const desiredGap = 2.0;
    const gap = (telLabel.yMm || 0) - ((srcRule.yMm || 0) + (srcRule.hMm || 0));
    if (gap < desiredGap) {
      const shift = +(desiredGap - gap).toFixed(2);
      const afterSrc = (srcRule.yMm || 0) + 0.01;
      next = next.map(el => {
        const id = el.id || '';
        if (
          id === 'tel' ||
          id === 'tel-label' ||
          id === 'tel-rule' ||
          id === 'gender' ||
          id === 'gender-label' ||
          id === 'gender-rule' ||
          id === 'batch' ||
          id === 'batch-label' ||
          id === 'batch-rule' ||
          /^(field-gender|field-batch)/.test(id)
        ) {
          if ((el.yMm || 0) >= afterSrc - 1) {
            changed = true;
            return { ...el, yMm: +(el.yMm + shift).toFixed(2) };
          }
        }
        return el;
      });
    }
  }

  // Photo circle ends ~y 18.6 — keep card # + QR below it (push down if too high).
  const qrIds = new Set(['qr', 'qr-frame', 'qr-frame-border', 'qr-caption', 'cnum']);
  const qr = next.find(e => e.id === 'qr');
  const targetQrTop = 26.2;
  if (qr && (qr.yMm || 0) < targetQrTop - 0.2) {
    const shift = +(targetQrTop - (qr.yMm || 0)).toFixed(2);
    next = next.map(el => {
      if (!qrIds.has(el.id || '')) {
        return el;
      }
      changed = true;
      return { ...el, yMm: +((el.yMm || 0) + shift).toFixed(2) };
    });
  }

  // Card number sits just under the photo, above the QR.
  next = next.map(el => {
    if (el.id !== 'cnum') {
      return el;
    }
    if ((el.yMm || 0) < 19.0 || (el.yMm || 0) > 21.5) {
      changed = true;
      return { ...el, xMm: 65.2, yMm: 19.6, wMm: 18.8, hMm: 2.2 };
    }
    return el;
  });

  if (changed && !next.some(e => e.id === 'layout-v5g')) {
    next = [
      {
        id: 'layout-v5g',
        type: 'shape',
        sourcePath: '',
        xMm: 0,
        yMm: 0,
        wMm: 0.01,
        hMm: 0.01,
        fill: '#FFFFFF',
        label: 'Layout v5g QR below photo',
        locked: true
      },
      ...next
    ];
  }

  return { elements: next, changed };
}

/** Keep logo-red accents on header/title bars; leave field underlines blue. */
export function upgradeAccentColors(elements: DesignElement[]): { elements: DesignElement[]; changed: boolean } {
  if (isPortraitVerticalLayout(elements)) {
    return { elements: elements || [], changed: false };
  }
  let changed = false;
  const next = (elements || []).map(el => {
    const id = el.id || '';
    if (el.type !== 'shape') {
      return el;
    }
    // Restore field underlines to blue if a prior pass turned them red.
    if (/^(name|class|src|tel)-rule$/.test(id) || /field-[\w-]+-rule$/.test(id)) {
      if (el.fill !== CARD_LINE) {
        changed = true;
        return { ...el, fill: CARD_LINE };
      }
      return el;
    }
    if (id === 'header-gold' || id === 'title-gold' || id === 'back-accent' || id === 'back-footer-rule') {
      if (el.fill !== CARD_GOLD) {
        changed = true;
        return { ...el, fill: CARD_GOLD };
      }
    }
    return el;
  });
  return { elements: next, changed };
}

/**
 * Upgrade / insert attractive header: circular white logo badge,
 * navy wash, gold hairline, serif brand mark.
 */
export function ensureHeaderLogo(elements: DesignElement[]): { elements: DesignElement[]; changed: boolean } {
  let list = (elements || []).filter(
    e => e.id !== 'header-logo-plate'
  );

  // Optional portrait ID keeps its own header — do not inject landscape chrome.
  if (isPortraitVerticalLayout(list)) {
    return { elements: list, changed: false };
  }

  // Always refresh header chrome to the clear emblem-badge layout.
  if (!list.some(e => e.id === 'layout-v5e')) {
    // fall through to rebuild
  } else if (list.some(e => e.id === 'header-logo')) {
    return { elements: list, changed: false };
  }

  // Rebuild header chrome from the current starter, keep body/fields/QR/photo.
  const starter = classicStarterElements();
  const headerIds = new Set([
    'layout-v5d',
    'layout-v5e',
    'header-band',
    'header-wash',
    'header-gold',
    'header-accent',
    'header-logo',
    'hilcoe-mark',
    'college-tagline',
    'title-banner',
    'title-gold',
    'card-title'
  ]);
  const keep = list.filter(
    e =>
      !headerIds.has(e.id) &&
      !(e.type === 'image' && e.sourcePath === 'college.logo' && (e.yMm || 0) < 14)
  );
  const header = starter.filter(e => headerIds.has(e.id));
  const markers = starter.filter(e =>
    /^(layout-v2|layout-v5|layout-v5b|layout-v5c|layout-v5d|layout-v5e|body-bg)$/.test(e.id)
  );
  const withoutOldMarkers = keep.filter(
    e => !/^(layout-v2|layout-v5|layout-v5b|layout-v5c|layout-v5d|layout-v5e|body-bg)$/.test(e.id)
  );

  return {
    elements: [...markers, ...header, ...withoutOldMarkers],
    changed: true
  };
}

/**
 * Migrate QR elements that still encode a site link (e.g. localhost)
 * to packed student/card field text instead.
 */
export function upgradeQrToDataFields(elements: DesignElement[]): { elements: DesignElement[]; changed: boolean } {
  let changed = false;
  const next = (elements || []).map(el => {
    if (el.type !== 'qr') {
      return el;
    }
    // Oversized field lists make a small card QR unreadable — trim to the short default.
    if (el.qrFields && el.qrFields.length > DEFAULT_QR_DATA_FIELDS.length) {
      changed = true;
      return {
        ...el,
        sourcePath: '',
        qrFields: [...DEFAULT_QR_DATA_FIELDS],
        qrLogo: true
      };
    }
    if (el.qrFields && el.qrFields.length) {
      // Restore center logo after earlier scannability hotfix turned it off.
      if (el.qrLogo === false) {
        changed = true;
        return { ...el, qrLogo: true };
      }
      return el;
    }
    const path = el.sourcePath || '';
    const isLinkMode =
      !path ||
      path === CARD_SCAN_LINK_PATH ||
      path === CARD_QR_TOKEN_PATH ||
      path === 'card.qr' ||
      path === 'qr';
    if (!isLinkMode) {
      return el;
    }
    changed = true;
    return {
      ...el,
      sourcePath: '',
      label: el.label || 'QR',
      qrFields: [...DEFAULT_QR_DATA_FIELDS],
      qrLogo: true
    };
  });
  return { elements: next, changed };
}

/** @deprecated Use upgradeQrToDataFields */
export function upgradeQrToErpScanLink(elements: DesignElement[]): { elements: DesignElement[]; changed: boolean } {
  return upgradeQrToDataFields(elements);
}

/** True when front is not yet using the circular profile photo. */
export function isLegacyPhotoFrame(elements: DesignElement[]): boolean {
  if (!elements?.length) {
    return true;
  }
  return !elements.some(e => e.id === 'photo-frame-v4');
}

/**
 * Circular profile photo (avatar style) — soft white ring only, no colored border/caption.
 */
export function classicPhotoFrameElements(): DesignElement[] {
  // Square bounds → rendered as circle via CSS (.el-photo-circle)
  const size = 16.2;
  const x = 66.6;
  const y = 2.4;
  const ring = 0.55;
  return [
    shape('photo-frame-v4', 0, 0, 0.01, 0.01, '#FFFFFF', 'Photo circle v4'),
    // Halo matches Service Request blue (no white gap beside the title bar)
    shape('photo-ring', x - ring, y - ring, size + ring * 2, size + ring * 2, CARD_BRAND, 'Photo ring'),
    shape('photo-inner', x, y, size, size, CARD_SURFACE, 'Photo inner'),
    {
      id: 'photo',
      type: 'image',
      sourcePath: 'student.photo',
      xMm: x,
      yMm: y,
      wMm: size,
      hMm: size,
      label: 'Photo'
    }
  ];
}

/** Replace old photo chrome with the circular profile photo; keeps other fields. */
export function upgradePhotoFrame(elements: DesignElement[]): DesignElement[] {
  const drop =
    /^(photo-frame-v3|photo-frame-v4|photo-frame-border|photo-frame-gold|photo-matte|photo-inner|photo-ring|photo|photo-caption)$/;
  const kept = (elements || []).filter(e => !drop.test(e.id || '')).map(e => {
    // Pull card # up under the circle
    if (e.id === 'cnum') {
      return { ...e, xMm: 64.5, yMm: 21.4, wMm: 20, hMm: 2.4 };
    }
    return e;
  });
  const headerIdx = kept.findIndex(e => e.id === 'header-accent');
  const at = headerIdx >= 0 ? headerIdx + 1 : 2;
  return [...kept.slice(0, at), ...classicPhotoFrameElements(), ...kept.slice(at)];
}

/** True when back layout is not the current refined table design (v3b readable footer). */
export function isLegacyBackLayout(elements: DesignElement[]): boolean {
  if (!elements?.length) {
    return true;
  }
  // Portrait optional starter has its own back (terms / logo / QR).
  if (isPortraitVerticalLayout(elements)) {
    return false;
  }
  return !elements.some(e => e.id === 'back-footer-band');
}

/** Optional vertical school-ID starter (front or back marker). */
export function isPortraitVerticalLayout(elements: DesignElement[]): boolean {
  return (elements || []).some(e =>
    /^(layout-portrait-v\d+|layout-portrait-back-v\d+)$/.test(e.id || '')
  );
}

/** Drop the red details accent above portrait fields (kept on older templates). */
export function stripPortraitDetailsAccent(elements: DesignElement[]): DesignElement[] {
  if (!isPortraitVerticalLayout(elements)) {
    return elements || [];
  }
  return (elements || []).filter(e => !(e.id === 'accent-line' && e.fill === CARD_GOLD));
}

/**
 * Keep Joined / Expire dates on the white area (above the navy footer wave).
 * Older portrait backs placed Expire too low so dark text vanished on blue.
 */
export function fixPortraitBackDateVisibility(elements: DesignElement[]): {
  elements: DesignElement[];
  changed: boolean;
} {
  const list = elements || [];
  if (!isPortraitVerticalLayout(list)) {
    return { elements: list, changed: false };
  }
  if (list.some(e => e.id === 'layout-portrait-back-v3')) {
    return { elements: list, changed: false };
  }

  const expire = list.find(e => e.id === 'expire' || e.id === 'expire-lbl');
  if (!expire || (expire.yMm || 0) <= 50) {
    return { elements: list, changed: false };
  }

  const yJoined = 45.2;
  const yExpire = 49.0;
  const next = list.map(el => {
    const id = el.id || '';
    if (id === 'joined' || id === 'joined-lbl' || id === 'joined-colon') {
      return { ...el, yMm: yJoined };
    }
    if (id === 'expire' || id === 'expire-lbl' || id === 'expire-colon') {
      return { ...el, yMm: yExpire };
    }
    // Push footer chrome down so the wave clears the dates.
    if (
      id === 'footer-band' ||
      id === 'footer-accent' ||
      id === 'footer-wave' ||
      id === 'wave-deep' ||
      id === 'footer-logo' ||
      id === 'footer-logo-lbl' ||
      id === 'footer-tag' ||
      id === 'qr-mat' ||
      id === 'qr-frame' ||
      id === 'qr'
    ) {
      const shift = 4.0;
      return { ...el, yMm: +((el.yMm || 0) + shift).toFixed(2) };
    }
    return el;
  });

  // Recalc footer-band height if present
  const band = next.find(e => e.id === 'footer-band');
  const adjusted = band
    ? next.map(el =>
        el.id === 'footer-band'
          ? { ...el, hMm: +(Math.max(8, 85.6 - (el.yMm || 0))).toFixed(2) }
          : el
      )
    : next;

  return {
    elements: [
      shape('layout-portrait-back-v3', 0, 0, 0.01, 0.01, '#FFFFFF', 'Portrait back v3 dates clear'),
      ...adjusted.filter(e => e.id !== 'layout-portrait-back-v2')
    ],
    changed: true
  };
}

function shape(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  label?: string
): DesignElement {
  return { id, type: 'shape', sourcePath: '', xMm: x, yMm: y, wMm: w, hMm: h, label: label || id, fill };
}

function slugifyFieldKey(sourcePath: string, fallback: string): string {
  const raw = (sourcePath || fallback || 'field').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return raw.replace(/^-|-$/g, '') || 'field';
}

/**
 * Build a Name-style row: editable label + bound value + underline.
 * Used when the user adds Gender / Issue date / etc. from the palette.
 */
export function createAlignedFieldRow(opts: {
  labelText: string;
  sourcePath: string;
  valueLabel?: string;
  rowTopMm: number;
  idPrefix?: string;
}): DesignElement[] {
  const L = FIELD_ROW_LAYOUT;
  const top = opts.rowTopMm;
  const prefix = opts.idPrefix || `field-${slugifyFieldKey(opts.sourcePath, opts.labelText)}-${Date.now()}`;
  const labelText = (opts.labelText || 'Label').trim() || 'Label';

  return [
    {
      id: `${prefix}-label`,
      type: 'staticText',
      sourcePath: '',
      staticText: labelText,
      label: `${labelText} label`,
      xMm: L.labelX,
      yMm: top,
      wMm: L.labelW,
      hMm: L.labelH,
      fontSizePt: L.labelFontPt,
      fontWeight: 'bold',
      fontFamily: FONT,
      color: CARD_MUTED,
      align: 'left'
    },
    {
      id: `${prefix}-value`,
      type: 'text',
      sourcePath: opts.sourcePath,
      label: opts.valueLabel || labelText,
      xMm: L.valueX,
      yMm: top - 0.15,
      wMm: L.valueW,
      hMm: L.valueH,
      fontSizePt: L.valueFontPt,
      fontWeight: 'bold',
      fontFamily: FONT,
      color: CARD_INK,
      align: 'left'
    },
    shape(`${prefix}-rule`, L.valueX, top + L.ruleOffsetY, L.valueW, L.ruleH, CARD_LINE, `${labelText} rule`)
  ];
}

/** Next Y for a new aligned field row (below existing label/value/rule rows). */
export function nextAlignedFieldRowY(elements: DesignElement[], cardHeightMm = 53.98): number {
  const L = FIELD_ROW_LAYOUT;
  const footerGuard = 48.2;
  let maxBottom: number = L.defaultTop;

  (elements || []).forEach(el => {
    const id = el.id || '';
    const isRowChrome =
      /-label$|-value$|-rule$/.test(id) ||
      /^(name|class|src|tel)(-label|-rule)?$/.test(id) ||
      id === 'name' ||
      id === 'class' ||
      id === 'src' ||
      id === 'tel';
    const isValueCol =
      el.type === 'text' &&
      Math.abs(el.xMm - L.valueX) < 1.5 &&
      el.wMm >= L.valueW * 0.6;
    const isLabelCol =
      el.type === 'staticText' &&
      Math.abs(el.xMm - L.labelX) < 1.5;
    if (isRowChrome || isValueCol || isLabelCol) {
      maxBottom = Math.max(maxBottom, el.yMm + (el.hMm || 0));
    }
  });

  const next = Math.max(L.defaultTop, +(maxBottom + 0.35).toFixed(1));
  const maxTop = Math.min(footerGuard, cardHeightMm - L.rowH - 1);
  return Math.min(next, maxTop);
}

/** Whether this palette item should be inserted as a full label+value+line row. */
export function shouldAddAsFieldRow(item: CardPaletteItem): boolean {
  return item?.type === 'text' && !!item.sourcePath;
}

function text(
  id: string,
  sourcePath: string,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: Partial<DesignElement> & { label: string }
): DesignElement {
  return {
    id,
    type: 'text',
    sourcePath,
    xMm: x,
    yMm: y,
    wMm: w,
    hMm: h,
    fontFamily: FONT,
    color: CARD_INK,
    fontSizePt: 7,
    fontWeight: 'normal',
    align: 'left',
    ...opts
  };
}

function staticTxt(
  id: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: Partial<DesignElement> & { label: string }
): DesignElement {
  return {
    id,
    type: 'staticText',
    sourcePath: '',
    staticText: value,
    xMm: x,
    yMm: y,
    wMm: w,
    hMm: h,
    fontFamily: FONT,
    color: CARD_INK,
    fontSizePt: 7,
    fontWeight: 'normal',
    align: 'left',
    ...opts
  };
}

/**
 * Neat HiLCoE Service Request Card — clear labels, even gaps, full student info.
 */
export function classicStarterElements(): DesignElement[] {
  const labelX = 3.2;
  const labelW = 14.0;
  const valueX = 17.6;
  const valueW = 45.5;
  const rowH = 4.2;
  const fieldTop = 19.4;
  const rule = (id: string, top: number, label: string) =>
    shape(id, valueX, top + 3.0, valueW, 0.22, CARD_LINE, label);

  const row = (
    index: number,
    ids: { label: string; value: string; rule: string },
    labelText: string,
    sourcePath: string,
    valueLabel: string
  ): DesignElement[] => {
    const top = fieldTop + rowH * index;
    return [
      staticTxt(ids.label, labelText, labelX, top, labelW, 2.9, {
        label: `${labelText} label`,
        fontSizePt: 5.8,
        fontWeight: 'bold',
        color: CARD_MUTED
      }),
      text(ids.value, sourcePath, valueX, top - 0.1, valueW, 3.1, {
        label: valueLabel,
        fontSizePt: index === 0 ? 7.6 : 7.1,
        fontWeight: 'bold',
        color: CARD_INK
      }),
      rule(ids.rule, top, `${labelText} rule`)
    ];
  };

  return [
    shape('layout-v2', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v2'),
    shape('layout-v5', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v5 compact'),
    shape('layout-v5b', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v5b title/photo blend'),
    shape('layout-v5c', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v5c qr lower'),
    shape('layout-v5d', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v5d attractive header'),
    shape('layout-v5e', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v5e clear logo badge'),
    shape('layout-v5f', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v5f SRC/QR padding'),
    shape('layout-v5g', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v5g QR below photo'),
    shape('layout-v5h', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v5h neat information'),
    shape('layout-v5i', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v5i signature'),
    shape('layout-v5k', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v5k current term'),
    shape('body-bg', 0, 0, 85.6, 53.98, '#FFFFFF', 'Body'),

    // Header
    shape('header-band', 0, 0, 85.6, 13.0, CARD_BRAND_DARK, 'Header band'),
    shape('header-wash', 0, 0, 40, 13.0, '#143A78', 'Header wash'),
    shape('header-gold', 13.6, 11.0, 28, 0.35, CARD_GOLD, 'Header accent line'),
    shape('header-accent', 0, 13.0, 85.6, 0.4, CARD_BRAND, 'Header accent'),
    {
      id: 'header-logo',
      type: 'image',
      sourcePath: 'college.logo',
      xMm: 2.2,
      yMm: 1.45,
      wMm: 9.8,
      hMm: 9.8,
      label: 'College logo'
    },
    text('hilcoe-mark', 'college.shortName', 13.5, 1.9, 42, 4.8, {
      label: 'HiLCoE',
      fontSizePt: 13.5,
      fontWeight: 'bold',
      fontFamily: SERIF,
      color: '#FFFFFF'
    }),
    text('college-tagline', 'college.tagline', 13.5, 6.9, 42, 3.0, {
      label: 'Tagline',
      fontSizePt: 5.4,
      fontWeight: 'normal',
      color: '#B7C9E6'
    }),

    shape('title-banner', 0, 13.4, 85.6, 4.5, CARD_BRAND, 'Title banner'),
    shape('title-gold', 0, 13.4, 1.1, 4.5, CARD_GOLD, 'Title accent'),
    text('card-title', 'card.title', 3.4, 14.0, 48, 3.4, {
      label: 'Card title',
      fontSizePt: 8,
      fontWeight: 'bold',
      color: '#FFFFFF'
    }),
    text('current-term', 'card.currentTerm', 52.5, 14.05, 30.5, 3.3, {
      label: 'Current term',
      fontSizePt: 7.4,
      fontWeight: 'bold',
      color: '#F6E7B2',
      align: 'right'
    }),

    ...classicPhotoFrameElements(),

    // Clear student information block
    ...row(0, { label: 'name-label', value: 'name', rule: 'name-rule' }, 'Name', 'student.fullName', 'Full name'),
    ...row(1, { label: 'class-label', value: 'class', rule: 'class-rule' }, 'Class', 'student.class', 'Class'),
    ...row(2, { label: 'src-label', value: 'src', rule: 'src-rule' }, 'Student ID', 'student.studentNumber', 'Student ID'),
    ...row(3, { label: 'tel-label', value: 'tel', rule: 'tel-rule' }, 'Phone', 'student.phone', 'Phone'),
    ...row(4, { label: 'batch-label', value: 'batch', rule: 'batch-rule' }, 'Batch', 'student.batch', 'Batch'),

    text('cnum', 'card.cardNumber', 65.2, 19.5, 18.8, 2.2, {
      label: 'Card #',
      fontSizePt: 5,
      fontFamily: 'Consolas, monospace',
      fontWeight: 'bold',
      color: CARD_BRAND_DARK,
      align: 'center'
    }),

    shape('qr-frame-border', 66.2, 26.0, 16.8, 16.8, CARD_BRAND_DARK, 'QR border'),
    shape('qr-frame', 66.45, 26.25, 16.3, 16.3, '#FFFFFF', 'QR frame'),
    {
      id: 'qr',
      type: 'qr',
      sourcePath: '',
      xMm: 67.05,
      yMm: 26.85,
      wMm: 15.1,
      hMm: 13.6,
      label: 'QR',
      qrFields: [...DEFAULT_QR_DATA_FIELDS],
      qrLogo: true
    },
    staticTxt('qr-caption', 'SCAN', 66.2, 43.2, 16.8, 2.0, {
      label: 'QR caption',
      fontSizePt: 5,
      fontWeight: 'bold',
      color: CARD_BRAND,
      align: 'center'
    }),

    // Signature intentionally omitted (Authorized Sign. removed from ID).

    shape('footer-band', 0, 47.6, 64.2, 6.38, CARD_SURFACE, 'Footer band'),
    shape('footer-rule', 0, 47.6, 64.2, 0.28, CARD_BRAND, 'Footer rule'),
    text('college-phone', 'college.phone', 3.2, 48.2, 38, 2.1, {
      label: 'College phone',
      fontSizePt: 5,
      color: CARD_BRAND_DARK,
      align: 'left'
    }),
    text('college-email', 'college.email', 3.2, 50.4, 32, 2.1, {
      label: 'College email',
      fontSizePt: 5,
      color: CARD_BRAND_DARK,
      align: 'left'
    }),
    text('college-web', 'college.web', 34, 50.4, 28, 2.1, {
      label: 'College web',
      fontSizePt: 5,
      fontWeight: 'bold',
      color: CARD_BRAND,
      align: 'right'
    })
  ];
}

/** Signature block under the landscape QR column (bottom-right). */
export function landscapeSignatureElements(): DesignElement[] {
  return [
    shape('sig-line', 66.8, 48.35, 15.6, 0.3, CARD_BRAND_DARK, 'Signature line'),
    staticTxt('sig-label', 'Authorized Sign.', 66.2, 49.0, 16.8, 2.6, {
      label: 'Signature label',
      fontSizePt: 5.2,
      fontWeight: '700',
      color: CARD_MUTED,
      align: 'center'
    })
  ];
}

const OVERLAY_ID =
  /^(watermark-logo|watermark-mark|layout-v5j|seal-stamp|layout-seal)$/;

/** Soft watermark for landscape (only when company enables it in settings). */
export function landscapeWatermarkElements(): DesignElement[] {
  return [
    {
      id: 'watermark-logo',
      type: 'image',
      sourcePath: 'college.watermark',
      xMm: 18.5,
      yMm: 19.5,
      wMm: 32,
      hMm: 32,
      label: 'Watermark',
      locked: true
    },
    text('watermark-mark', 'college.shortName', 6, 30.5, 54, 9, {
      label: 'Watermark text',
      fontSizePt: 22,
      fontWeight: '800',
      fontFamily: SERIF,
      color: CARD_BRAND_DARK,
      align: 'center',
      locked: true
    })
  ];
}

/** Soft watermark for portrait (optional). */
export function portraitWatermarkElements(): DesignElement[] {
  return [
    {
      id: 'watermark-logo',
      type: 'image',
      sourcePath: 'college.watermark',
      xMm: 12,
      yMm: 48,
      wMm: 30,
      hMm: 30,
      label: 'Watermark',
      locked: true
    }
  ];
}

/** Official seal / stamp near the signature area (optional). */
export function landscapeSealElements(): DesignElement[] {
  return [
    {
      id: 'seal-stamp',
      type: 'image',
      sourcePath: 'college.seal',
      xMm: 48.5,
      yMm: 36.5,
      wMm: 14.5,
      hMm: 14.5,
      label: 'Seal',
      locked: true
    }
  ];
}

export function portraitSealElements(): DesignElement[] {
  return [
    {
      id: 'seal-stamp',
      type: 'image',
      sourcePath: 'college.seal',
      xMm: 19.5,
      yMm: 38.5,
      wMm: 15,
      hMm: 15,
      label: 'Seal',
      locked: true
    }
  ];
}

export function stripOptionalOverlays(elements: DesignElement[]): DesignElement[] {
  return (elements || []).filter(e => !OVERLAY_ID.test(e.id || ''));
}

/**
 * Apply optional watermark / seal from template settings.
 * Pass null/false to omit that overlay.
 */
export function applyOptionalOverlays(
  elements: DesignElement[],
  opts: { watermark?: boolean; seal?: boolean; portrait?: boolean }
): DesignElement[] {
  let next = stripOptionalOverlays(elements);
  const portrait = !!opts.portrait || isPortraitVerticalLayout(next);
  const bodyIdx = next.findIndex(e => e.id === 'body-bg' || e.id === 'back-body');
  const insertAt = bodyIdx >= 0 ? bodyIdx + 1 : 0;

  if (opts.watermark) {
    const marks = portrait ? portraitWatermarkElements() : landscapeWatermarkElements();
    next = [...next.slice(0, insertAt), ...marks, ...next.slice(insertAt)];
  }
  if (opts.seal) {
    const seals = portrait ? portraitSealElements() : landscapeSealElements();
    // Seal sits above fields — append so it paints over the watermark.
    next = [...next, ...seals];
  }
  return next;
}

/** Remove Authorized Sign. line under the QR (client: not used on ID). */
export function stripSignatureFromLayout(elements: DesignElement[]): { elements: DesignElement[]; changed: boolean } {
  const list = elements || [];
  const isSig = (e: DesignElement) =>
    /^(sig-line|sig-label|layout-v5i)$/i.test(e.id || '') ||
    (e.type === 'staticText' && /authorized\s*sign/i.test((e.staticText || '').trim()));

  if (!list.some(isSig)) {
    return { elements: list, changed: false };
  }
  return { elements: list.filter(e => !isSig(e)), changed: true };
}

/**
 * Align Department (and similar) rows with classic Name/Batch geometry:
 * same label column, value column, and underline (rule) width/position.
 */
export function fixLabeledFieldOverlap(elements: DesignElement[]): { elements: DesignElement[]; changed: boolean } {
  const list = (elements || []).map(e => ({ ...e }));
  let changed = false;
  const L = FIELD_ROW_LAYOUT;

  const isDeptLabel = (el: DesignElement) =>
    /^(dept-label|department-label)$/i.test(el.id || '') ||
    /-department-.*-label$/i.test(el.id || '') ||
    (el.type === 'staticText' && /^depart/i.test((el.staticText || '').trim()));

  const isDeptValue = (el: DesignElement) =>
    /^(dept|department)$/i.test(el.id || '') ||
    /-department-.*-value$/i.test(el.id || '') ||
    el.sourcePath === 'student.department';

  const isDeptRule = (el: DesignElement) =>
    /^(dept-rule|department-rule)$/i.test(el.id || '') ||
    /-department-.*-rule$/i.test(el.id || '') ||
    (el.type === 'shape' && /department|dept/i.test(el.label || el.id || ''));

  let deptValueTop: number | null = null;

  for (const el of list) {
    if (isDeptLabel(el) && el.type === 'staticText') {
      if ((el.staticText || '') !== 'Dept'
        || Math.abs((el.xMm || 0) - L.labelX) > 0.3
        || Math.abs((el.wMm || 0) - L.labelW) > 0.3) {
        el.staticText = 'Dept';
        el.xMm = L.labelX;
        el.wMm = L.labelW;
        el.hMm = L.labelH;
        el.fontSizePt = L.labelFontPt;
        el.fontWeight = 'bold';
        el.color = CARD_MUTED;
        changed = true;
      }
    }

    if (isDeptValue(el) && (el.type === 'text' || el.type === 'staticText')) {
      deptValueTop = el.yMm ?? null;
      if (Math.abs((el.xMm || 0) - L.valueX) > 0.3
        || Math.abs((el.wMm || 0) - L.valueW) > 0.3) {
        el.xMm = L.valueX;
        el.wMm = L.valueW;
        el.hMm = L.valueH;
        el.fontSizePt = L.valueFontPt;
        el.fontWeight = 'bold';
        changed = true;
      }
    }
  }

  // Sync or create the Department underline to match Name/Batch rules.
  let deptRule = list.find(isDeptRule);
  const ruleY = deptValueTop != null ? deptValueTop + L.ruleOffsetY + 0.1 : null;
  if (deptValueTop != null) {
    if (deptRule) {
      if (Math.abs((deptRule.xMm || 0) - L.valueX) > 0.2
        || Math.abs((deptRule.wMm || 0) - L.valueW) > 0.2
        || Math.abs((deptRule.hMm || 0) - L.ruleH) > 0.05
        || (ruleY != null && Math.abs((deptRule.yMm || 0) - ruleY) > 0.4)
        || deptRule.fill !== CARD_LINE) {
        deptRule.xMm = L.valueX;
        deptRule.wMm = L.valueW;
        deptRule.hMm = L.ruleH;
        if (ruleY != null) {
          deptRule.yMm = ruleY;
        }
        deptRule.fill = CARD_LINE;
        changed = true;
      }
    } else {
      list.push(
        shape('dept-rule', L.valueX, (ruleY ?? deptValueTop + L.ruleOffsetY), L.valueW, L.ruleH, CARD_LINE, 'Dept rule')
      );
      changed = true;
    }
  }

  // Generic: pull misaligned value underlines (field-*-rule) onto the classic value column.
  for (const rule of list) {
    const id = rule.id || '';
    if (rule.type !== 'shape' || !/-rule$/i.test(id)) {
      continue;
    }
    if (/^(footer-rule|header-|title-|back-|sig-|accent)/i.test(id)) {
      continue;
    }
    // Skip already-classic name/class/src/tel/batch rules — they define the reference.
    if (/^(name|class|src|tel|batch)-rule$/i.test(id)) {
      continue;
    }
    if (Math.abs((rule.xMm || 0) - L.valueX) > 0.4 || Math.abs((rule.wMm || 0) - L.valueW) > 0.4) {
      rule.xMm = L.valueX;
      rule.wMm = L.valueW;
      rule.hMm = L.ruleH;
      rule.fill = CARD_LINE;
      changed = true;
    }
  }

  // Generic: any static label whose value sibling on the same row starts too far left.
  for (const label of list) {
    if (label.type !== 'staticText' || !label.staticText) {
      continue;
    }
    const labelEnd = (label.xMm || 0) + Math.min(label.wMm || 0, 16);
    for (const value of list) {
      if (value === label || (value.type !== 'text' && value.type !== 'staticText')) {
        continue;
      }
      if (Math.abs((value.yMm || 0) - (label.yMm || 0)) > 1.2) {
        continue;
      }
      if ((value.xMm || 0) < labelEnd - 0.5 && (value.xMm || 0) >= (label.xMm || 0) - 1) {
        value.xMm = L.valueX;
        value.wMm = L.valueW;
        changed = true;
      }
    }
  }

  return { elements: list, changed };
}

/** Remove Gender fields from saved layouts (client: not shown on ID). */
export function stripGenderFromLayout(elements: DesignElement[]): { elements: DesignElement[]; changed: boolean } {
  const list = elements || [];
  const isGender = (e: DesignElement) =>
    /^(gender|gender-label|gender-rule)$/i.test(e.id || '') ||
    e.sourcePath === 'student.gender' ||
    /^field-gender/i.test(e.id || '') ||
    (e.type === 'staticText' && /^gender$/i.test((e.staticText || '').trim()));

  if (!list.some(isGender)) {
    return { elements: list, changed: false };
  }

  const rowH = 4.2;
  const next = list
    .filter(e => !isGender(e))
    .map(e => {
      // Pull Batch up into the freed Gender row on classic layouts.
      if (/^(batch|batch-label|batch-rule)$/i.test(e.id || '') || /^field-batch/i.test(e.id || '')) {
        return { ...e, yMm: (e.yMm || 0) - rowH };
      }
      return e;
    });
  return { elements: next, changed: true };
}

/** Current term element for the Service Request title banner. */
export function currentTermTitleElements(): DesignElement[] {
  return [
    text('current-term', 'card.currentTerm', 52.5, 14.05, 30.5, 3.3, {
      label: 'Current term',
      fontSizePt: 7.4,
      fontWeight: 'bold',
      color: '#F6E7B2',
      align: 'right'
    }),
    shape('layout-v5k', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v5k current term')
  ];
}

/** Insert current term on the title banner when missing (keeps other layout). */
export function ensureCurrentTermOnTitle(elements: DesignElement[]): { elements: DesignElement[]; changed: boolean } {
  const list = elements || [];
  if (isPortraitVerticalLayout(list)) {
    return { elements: list, changed: false };
  }
  if (list.some(e => e.id === 'current-term' || e.sourcePath === 'card.currentTerm' || e.id === 'layout-v5k')) {
    return { elements: list, changed: false };
  }
  if (!list.some(e => e.id === 'card-title' || e.sourcePath === 'card.title')) {
    return { elements: list, changed: false };
  }

  const next = list.map(e => {
    if (e.id === 'card-title' && (e.wMm || 0) > 50) {
      return { ...e, wMm: 48 };
    }
    return e;
  });
  const titleIdx = next.findIndex(e => e.id === 'card-title');
  const insertAt = titleIdx >= 0 ? titleIdx + 1 : next.length;
  const withTerm = [
    ...next.slice(0, insertAt),
    ...currentTermTitleElements(),
    ...next.slice(insertAt)
  ];
  return { elements: withTerm, changed: true };
}

/** Insert landscape signature under QR when missing (keeps other layout). */
export function ensureLandscapeSignature(elements: DesignElement[]): { elements: DesignElement[]; changed: boolean } {
  const list = elements || [];
  if (isPortraitVerticalLayout(list)) {
    return { elements: list, changed: false };
  }
  if (list.some(e => e.id === 'sig-line' || e.id === 'sig-label' || e.id === 'layout-v5i')) {
    return { elements: list, changed: false };
  }

  const sig = landscapeSignatureElements();
  const captionIdx = list.findIndex(e => e.id === 'qr-caption');
  const qrIdx = list.findIndex(e => e.id === 'qr');
  const insertAt =
    captionIdx >= 0 ? captionIdx + 1 : qrIdx >= 0 ? qrIdx + 1 : list.length;

  const next = [
    ...list.slice(0, insertAt),
    ...sig,
    shape('layout-v5i', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v5i signature'),
    ...list.slice(insertAt)
  ];
  return { elements: next, changed: true };
}

/**
 * Refined back: Term / Course(s) / Remark grid.
 * Light frosted panel + slim brand chrome so background art can show through.
 */
export function classicBackStarterElements(): DesignElement[] {
  const panelX = 3.2;
  const panelY = 3.0;
  const panelW = 79.2;
  const panelH = 48.0;
  const headH = 5.4;
  const rowH = 4.7;
  const startY = panelY + 5.4 + headH;
  const termW = 11.5;
  const courseX = panelX + 13.2;
  const courseW = 44.5;
  const remarkX = panelX + 58.5;
  const remarkW = 19.5;

  const rows: DesignElement[] = [
    shape('layout-v3-back', 0, 0, 0.01, 0.01, '#FFFFFF', 'Layout v3 back'),
    shape('back-body', 0, 0, 85.6, 53.98, '#FFFFFF', 'Body'),

    // Outer CR80 frame (saved with the design — print must not invent or strip this)
    shape('back-border-t', 2, 2, 81.6, 0.55, CARD_BRAND, 'Border top'),
    shape('back-border-b', 2, 51.15, 81.6, 0.55, CARD_BRAND, 'Border bottom'),
    shape('back-border-l', 2, 2, 0.55, 50, CARD_BRAND, 'Border left'),
    shape('back-border-r', 82.75, 2, 0.55, 50, CARD_BRAND, 'Border right'),

    // Soft frosted content panel (clears when a background image is set)
    shape('back-panel', panelX, panelY, panelW, panelH, 'rgba(255,255,255,0.88)', 'Frost panel'),

    // Slim brand top rail + gold accent
    shape('back-rail', panelX, panelY, panelW, 1.0, CARD_BRAND_DARK, 'Top rail'),
    shape('back-accent', panelX, panelY + 1.0, panelW, 0.35, CARD_GOLD, 'Gold accent'),

    // Soft title band (kept even with background so type stays readable)
    shape('back-title-band', panelX, panelY + 1.35, panelW, 4.0, 'rgba(255,255,255,0.92)', 'Title band'),
    staticTxt('back-title', 'ACADEMIC SERVICE RECORD', panelX + 1.5, panelY + 1.9, 52, 3.0, {
      label: 'Back title',
      fontSizePt: 7,
      fontWeight: 'bold',
      fontFamily: FONT,
      color: CARD_BRAND_DARK,
      align: 'left'
    }),
    text('back-college', 'college.shortName', panelX + 54, panelY + 1.9, 23.5, 3.0, {
      label: 'College mark',
      fontSizePt: 7,
      fontWeight: 'bold',
      fontFamily: SERIF,
      color: CARD_BRAND,
      align: 'right'
    }),

    // Light column header strip (not a heavy navy slab)
    shape('back-head', panelX, panelY + 5.4, panelW, headH, 'rgba(244,247,252,0.95)', 'Table header'),
    shape('back-head-line', panelX, panelY + 5.4 + headH - 0.3, panelW, 0.3, CARD_BRAND, 'Header rule'),

    staticTxt('h-term', 'TERM', panelX + 0.6, panelY + 6.6, termW, 3.4, {
      label: 'Term header',
      fontSizePt: 6.5,
      fontWeight: 'bold',
      fontFamily: FONT,
      color: CARD_BRAND,
      align: 'center'
    }),
    staticTxt('h-courses', 'COURSE(S)', courseX, panelY + 6.6, courseW, 3.4, {
      label: 'Courses header',
      fontSizePt: 6.5,
      fontWeight: 'bold',
      fontFamily: FONT,
      color: CARD_BRAND,
      align: 'left'
    }),
    staticTxt('h-remark', 'REMARK', remarkX, panelY + 6.6, remarkW, 3.4, {
      label: 'Remark header',
      fontSizePt: 6.5,
      fontWeight: 'bold',
      fontFamily: FONT,
      color: CARD_BRAND,
      align: 'center'
    }),

    // Soft column guides
    shape('col-v1', panelX + 12.6, panelY + 5.4, 0.25, panelH - 10.6, CARD_LINE, 'Col 1'),
    shape('col-v2', panelX + 57.8, panelY + 5.4, 0.25, panelH - 10.6, CARD_LINE, 'Col 2')
  ];

  for (let i = 0; i < 6; i++) {
    const y = startY + i * rowH;
    // Soft zebra that clears when background art is active
    const fill = i % 2 === 0 ? 'rgba(244,247,252,0.55)' : 'rgba(255,255,255,0.15)';
    rows.push(shape(`row-bg-${i}`, panelX, y, panelW, rowH, fill, `Row ${i + 1}`));
    rows.push(shape(`row-line-${i}`, panelX + 1, y + rowH - 0.2, panelW - 2, 0.2, CARD_LINE, `Row line ${i + 1}`));
    if (i < 2) {
      rows.push(
        text(`term-${i}`, `back.term${i + 1}`, panelX + 0.6, y + 0.9, termW, 3.2, {
          label: `Term ${i + 1}`,
          fontSizePt: 7,
          fontWeight: 'bold',
          align: 'center',
          color: CARD_BRAND_DARK
        })
      );
      rows.push(
        text(`courses-${i}`, `back.courses${i + 1}`, courseX, y + 0.9, courseW, 3.2, {
          label: `Courses ${i + 1}`,
          fontSizePt: 6.5,
          color: CARD_INK
        })
      );
      rows.push(
        text(`remark-${i}`, `back.remark${i + 1}`, remarkX, y + 0.9, remarkW, 3.2, {
          label: `Remark ${i + 1}`,
          fontSizePt: 6.5,
          color: CARD_MUTED,
          align: 'center'
        })
      );
    }
  }

  // Navy footer band + white type (readable over background art’s dark bottom)
  const footerY = panelY + panelH - 4.6;
  rows.push(shape('back-footer-rule', panelX, footerY - 0.35, panelW, 0.35, CARD_GOLD, 'Footer gold'));
  rows.push(shape('back-footer-band', panelX, footerY, panelW, 4.6, CARD_BRAND_DARK, 'Footer band'));
  rows.push(
    staticTxt('back-note', 'Official HiLCoE academic service record', panelX + 1.4, footerY + 1.1, 52, 2.6, {
      label: 'Back note',
      fontSizePt: 5.5,
      fontWeight: 'bold',
      color: '#FFFFFF'
    })
  );
  rows.push(
    text('back-cnum', 'card.cardNumber', panelX + 52, footerY + 1.1, 25.5, 2.6, {
      label: 'Card #',
      fontSizePt: 5.5,
      fontFamily: 'Consolas, monospace',
      fontWeight: 'bold',
      color: '#FFFFFF',
      align: 'right'
    })
  );

  return rows;
}

/**
 * Optional portrait ID (CR80 badge) — polished vertical school card.
 * Size: 53.98 × 85.6 mm. Does not replace the landscape HiLCoE starter.
 */
export function portraitVerticalStarterElements(): DesignElement[] {
  const W = 53.98;
  const H = 85.6;
  const padX = 5.2;
  const labelW = 19.5;
  const colonW = 1.6;
  const valueX = padX + labelW + colonW + 0.4;
  const valueW = W - valueX - padX;
  const photoSize = 23.5;
  const photoX = (W - photoSize) / 2;
  const photoY = 23.2;
  const fieldTop = 50.2;
  const rowGap = 4.55;

  const fieldRow = (index: number, id: string, label: string, source: string): DesignElement[] => {
    const y = fieldTop + index * rowGap;
    return [
      staticTxt(`${id}-lbl`, label, padX, y, labelW, 3.5, {
        label: `${label} label`,
        fontSizePt: 6.4,
        fontWeight: '700',
        fontFamily: FONT,
        color: CARD_BRAND_DARK,
        align: 'left'
      }),
      staticTxt(`${id}-colon`, ':', padX + labelW, y, colonW, 3.5, {
        label: `${label} colon`,
        fontSizePt: 6.4,
        fontWeight: '700',
        color: CARD_BRAND_DARK,
        align: 'center'
      }),
      text(id, source, valueX, y, valueW, 3.5, {
        label,
        fontSizePt: 6.6,
        fontWeight: '600',
        fontFamily: FONT,
        color: CARD_INK,
        align: 'left'
      }),
      shape(`field-rule-${id}`, padX, y + 3.55, W - padX * 2, 0.18, 'rgba(155,176,212,0.55)', `${label} rule`)
    ];
  };

  return [
    shape('layout-portrait-v2', 0, 0, 0.01, 0.01, '#FFFFFF', 'Portrait vertical v2'),
    shape('body-bg', 0, 0, W, H, '#FFFFFF', 'Body'),

    // Layered header + soft shine
    shape('header-band', 0, 0, W, 29.5, CARD_BRAND, 'Header'),
    { ...shape('header-shine', 0, 0, W, 8.5, 'rgba(255,255,255,0.10)', 'Header shine'), locked: true },
    shape('header-gold', 0, 0, W, 0.55, CARD_GOLD, 'Header accent'),

    // Multi-layer wave (deep navy → mid → white) so the photo sits on the curve
    { ...shape('wave-deep', -26, 16.5, W + 52, 28, CARD_BRAND_DARK, 'Wave deep'), locked: true },
    { ...shape('wave-mid', -20, 21.5, W + 40, 24, CARD_BRAND, 'Wave mid'), locked: true },
    { ...shape('wave-soft', -24, 28.5, W + 48, 22, 'rgba(27,79,156,0.18)', 'Wave soft'), locked: true },
    { ...shape('wave-white', -28, 31.5, W + 56, 26, '#FFFFFF', 'Wave white'), locked: true },

    text('school-name', 'college.shortName', 3.5, 5.2, W - 7, 5.2, {
      label: 'School',
      fontSizePt: 12,
      fontWeight: '800',
      fontFamily: FONT,
      color: '#FFFFFF',
      align: 'center'
    }),
    text('school-slogan', 'college.tagline', 4.5, 11.2, W - 9, 4.2, {
      label: 'Slogan',
      fontSizePt: 5.4,
      fontWeight: '500',
      fontFamily: FONT,
      color: 'rgba(255,255,255,0.9)',
      align: 'center'
    }),

    // Photo: white halo + navy ring + soft matte
    shape('photo-frame-v4', 0, 0, 0.01, 0.01, '#FFFFFF', 'Photo circle'),
    shape('photo-halo', photoX - 2.0, photoY - 2.0, photoSize + 4.0, photoSize + 4.0, '#FFFFFF', 'Photo halo'),
    shape('photo-ring', photoX - 1.15, photoY - 1.15, photoSize + 2.3, photoSize + 2.3, CARD_BRAND_DARK, 'Photo ring'),
    shape('photo-inner', photoX, photoY, photoSize, photoSize, CARD_SURFACE, 'Photo inner'),
    {
      id: 'photo',
      type: 'image',
      sourcePath: 'student.photo',
      xMm: photoX,
      yMm: photoY,
      wMm: photoSize,
      hMm: photoSize,
      label: 'Photo'
    },

    ...fieldRow(0, 'reg', 'Reg No', 'student.studentNumber'),
    ...fieldRow(1, 'sid', 'Student ID', 'card.cardNumber'),
    ...fieldRow(2, 'sname', 'Student Name', 'student.fullName'),
    ...fieldRow(3, 'guardian', 'Father/Guardian', 'student.guardian'),
    ...fieldRow(4, 'class', 'Class', 'student.class'),
    ...fieldRow(5, 'emerg', 'Emergency Call', 'student.emergencyPhone')
  ];
}

/** Optional portrait back — terms, contacts, signature, dates, logo + QR footer. */
export function portraitVerticalBackStarterElements(): DesignElement[] {
  const W = 53.98;
  const H = 85.6;
  const padX = 5.2;
  // Keep dates fully above the wave; footer starts lower.
  const footerY = 61.5;
  const contactLabelW = 12.5;
  const contactValueX = padX + contactLabelW + 1.2;

  const contactRow = (id: string, label: string, source: string, y: number): DesignElement[] => [
    staticTxt(`${id}-lbl`, `${label}`, padX, y, contactLabelW, 3.2, {
      label: `${label} label`,
      fontSizePt: 6.2,
      fontWeight: '700',
      color: CARD_BRAND_DARK,
      align: 'left'
    }),
    staticTxt(`${id}-colon`, ':', padX + contactLabelW, y, 1.5, 3.2, {
      label: `${label} colon`,
      fontSizePt: 6.2,
      fontWeight: '700',
      color: CARD_BRAND_DARK,
      align: 'center'
    }),
    text(id, source, contactValueX, y, W - contactValueX - padX, 3.2, {
      label,
      fontSizePt: 6,
      fontWeight: '600',
      color: CARD_INK,
      align: 'left'
    })
  ];

  return [
    shape('layout-portrait-back-v3', 0, 0, 0.01, 0.01, '#FFFFFF', 'Portrait back v3 dates clear'),
    shape('back-body', 0, 0, W, H, '#FFFFFF', 'Body'),

    shape('back-header', 0, 0, W, 11, CARD_BRAND, 'Terms header'),
    shape('back-header-accent', 0, 0, W, 0.5, CARD_GOLD, 'Terms accent'),
    staticTxt('back-terms-title', 'TERMS AND CONDITIONS', 3, 3.2, W - 6, 4.8, {
      label: 'Terms title',
      fontSizePt: 8.2,
      fontWeight: '800',
      fontFamily: FONT,
      color: '#FFFFFF',
      align: 'center'
    }),

    staticTxt(
      'back-terms-1',
      '• This card remains college property and must be returned on request.',
      padX,
      12.8,
      W - padX * 2,
      5.2,
      { label: 'Term 1', fontSizePt: 5.4, color: '#334155', align: 'left', fontFamily: FONT }
    ),
    staticTxt(
      'back-terms-2',
      '• Present for campus services. Report loss or damage immediately.',
      padX,
      18.4,
      W - padX * 2,
      5.2,
      { label: 'Term 2', fontSizePt: 5.4, color: '#334155', align: 'left', fontFamily: FONT }
    ),

    shape('accent-line', padX, 24.4, W - padX * 2, 0.28, CARD_LINE, 'Contact rule'),

    ...contactRow('back-phone', 'Phone', 'college.phone', 26.0),
    ...contactRow('back-mail', 'Mail', 'college.email', 29.8),
    ...contactRow('back-web', 'Website', 'college.web', 33.6),

    shape('sig-rule', 16, 39.8, 22, 0.28, CARD_BRAND_DARK, 'Signature line'),
    staticTxt('sig-label', 'Principal', 14, 40.9, 26, 2.8, {
      label: 'Principal',
      fontSizePt: 6.2,
      fontWeight: '700',
      color: CARD_BRAND_DARK,
      align: 'center'
    }),

    // Dates stay on white — above the navy wave
    staticTxt('joined-lbl', 'Joined Date', 5, 45.2, 16, 3, {
      label: 'Joined label',
      fontSizePt: 5.4,
      fontWeight: '700',
      color: CARD_MUTED,
      align: 'right'
    }),
    staticTxt('joined-colon', ':', 21.2, 45.2, 1.5, 3, {
      label: 'Joined colon',
      fontSizePt: 5.4,
      fontWeight: '700',
      color: CARD_MUTED,
      align: 'center'
    }),
    text('joined', 'card.issuedAt', 23, 45.2, 24, 3, {
      label: 'Joined',
      fontSizePt: 5.5,
      fontWeight: '600',
      color: CARD_INK,
      align: 'left'
    }),
    staticTxt('expire-lbl', 'Expire Date', 5, 49.0, 16, 3, {
      label: 'Expire label',
      fontSizePt: 5.4,
      fontWeight: '700',
      color: CARD_MUTED,
      align: 'right'
    }),
    staticTxt('expire-colon', ':', 21.2, 49.0, 1.5, 3, {
      label: 'Expire colon',
      fontSizePt: 5.4,
      fontWeight: '700',
      color: CARD_MUTED,
      align: 'center'
    }),
    text('expire', 'card.expiresAt', 23, 49.0, 24, 3, {
      label: 'Expires',
      fontSizePt: 5.5,
      fontWeight: '600',
      color: CARD_INK,
      align: 'left'
    }),

    // Wave starts below expire date (~52+)
    { ...shape('footer-wave', -28, footerY - 8, W + 56, 22, '#FFFFFF', 'Footer wave'), locked: true },
    shape('footer-band', 0, footerY, W, H - footerY, CARD_BRAND, 'Footer'),
    shape('footer-accent', 0, footerY, W, 0.45, CARD_GOLD, 'Footer accent'),
    { ...shape('wave-deep', -30, footerY - 3.2, W + 60, 12, CARD_BRAND_DARK, 'Footer wave deep'), locked: true },

    {
      id: 'footer-logo',
      type: 'image',
      sourcePath: 'college.logo',
      xMm: 4.2,
      yMm: footerY + 5.8,
      wMm: 10.5,
      hMm: 10.5,
      label: 'Logo'
    },
    text('footer-logo-lbl', 'college.shortName', 15.8, footerY + 6.6, 17.5, 3.2, {
      label: 'College short name',
      fontSizePt: 7,
      fontWeight: '800',
      color: '#FFFFFF',
      align: 'left'
    }),
    text('footer-tag', 'college.tagline', 15.8, footerY + 10.2, 17.5, 5.2, {
      label: 'Tagline',
      fontSizePt: 4.4,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.88)',
      align: 'left'
    }),

    shape('qr-mat', 35.4, footerY + 5.2, 14.6, 14.6, '#FFFFFF', 'QR mat'),
    shape('qr-frame', 35.7, footerY + 5.5, 14.0, 14.0, CARD_BRAND_DARK, 'QR frame'),
    {
      id: 'qr',
      type: 'qr',
      sourcePath: '',
      xMm: 36.15,
      yMm: footerY + 5.95,
      wMm: 13.1,
      hMm: 13.1,
      label: 'QR',
      qrFields: [...DEFAULT_QR_DATA_FIELDS],
      qrLogo: true
    }
  ];
}

export function groupPalette(items: CardPaletteItem[]): Array<{ group: string; items: CardPaletteItem[] }> {
  const map = new Map<string, CardPaletteItem[]>();
  (items || []).forEach(item => {
    const key = item.group || 'Fields';
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
  });
  return Array.from(map.entries()).map(([group, grouped]) => ({ group, items: grouped }));
}
