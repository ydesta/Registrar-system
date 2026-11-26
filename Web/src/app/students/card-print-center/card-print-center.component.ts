import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { environment } from 'src/environments/environment';
import {
  cardField,
  cardValuesFromStudentCard,
  collegeLogoOrDefault,
  ensureCurrentTermOnTitle,
  parseCardLayout,
  resolveCardMediaUrl,
  stripGenderFromLayout
} from '../card-template-designer/card-layout.model';
import { DesignElement } from '../card-template-designer/design-element.model';
import { studentCardStatusColor, studentCardStatusLabel } from '../shared/card-status.util';
import { StudentCardPrintService } from '../shared/student-card-print.service';

export interface PrintFace {
  cardId: string;
  cardNumber: string;
  fullName: string;
  studentNumber: string;
  programme: string;
  batch: string;
  photoUrl: string | null;
  widthMm: number;
  heightMm: number;
  frontElements: DesignElement[];
  backElements: DesignElement[];
  values: Record<string, string>;
  backgroundUrl: string | null;
  backBackgroundUrl: string | null;
}

type RosterFilter = 'all' | 'printed' | 'not-printed' | 'no-card';

const ACTIVE_STATUS = 2;
const MAX_BULK = 40;

@Component({
  selector: 'app-card-print-center',
  templateUrl: './card-print-center.component.html',
  styleUrls: ['./card-print-center.component.scss']
})
export class CardPrintCenterComponent implements OnInit, OnDestroy {
  /** Full batch student list from roster API. */
  roster: any[] = [];
  /** Filtered view of roster. */
  rows: any[] = [];
  rosterFilter: RosterFilter = 'not-printed';
  batchCode: string | null = null;
  batches: Array<{ code: string; label: string }> = [];
  loadingBatches = false;
  loading = false;
  searchKey = '';
  selected = new Set<string>();
  checkedAll = false;
  preparing = false;
  printVisible = false;
  printLoading = false;
  faces: PrintFace[] = [];
  printModalWidth: number | string = 720;
  emptyHint = '';
  summary = { count: 0, printedCount: 0, notPrintedCount: 0, noCardCount: 0 };
  readonly maxBulk = MAX_BULK;
  private readonly fileUrl = environment.fileUrl;
  private preselectIds: string[] = [];
  private searchTimer: any;

  constructor(
    private crud: CrudService,
    private notify: CustomNotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private cardPrint: StudentCardPrintService
  ) {}

  ngOnInit(): void {
    const idsParam = this.route.snapshot.queryParamMap.get('ids');
    if (idsParam) {
      this.preselectIds = idsParam.split(',').map(s => s.trim()).filter(Boolean);
    }
    const batchParam = this.route.snapshot.queryParamMap.get('batch');
    if (batchParam) {
      this.batchCode = batchParam;
    }
    this.loadBatches();
    if (this.batchCode) {
      this.loadRoster();
    }
    this.updateModalWidth();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  private readonly onResize = (): void => this.updateModalWidth();

  private updateModalWidth(): void {
    const w = window.innerWidth || 1200;
    this.printModalWidth = w < 768 ? '96%' : 760;
  }

  get selectedCount(): number {
    return this.selected.size;
  }

  loadBatches(): void {
    this.loadingBatches = true;
    this.crud.getList('/batchs').subscribe({
      next: (res: any) => {
        this.loadingBatches = false;
        const raw = Array.isArray(res) ? res : (res?.data || []);
        this.batches = (Array.isArray(raw) ? raw : [])
          .map((b: any) => ({
            code: b.batchCode || b.BatchCode || b.code || '',
            label: b.batchCode || b.BatchCode || b.name || b.Name || ''
          }))
          .filter((b: any) => !!b.code)
          .sort((a: any, b: any) => String(a.code).localeCompare(String(b.code)));
      },
      error: () => {
        this.loadingBatches = false;
        this.batches = [];
      }
    });
  }

  onBatchChange(): void {
    this.selected.clear();
    this.checkedAll = false;
    this.rosterFilter = 'not-printed';
    this.searchKey = '';
    if (this.batchCode) {
      this.loadRoster();
    } else {
      this.roster = [];
      this.rows = [];
      this.summary = { count: 0, printedCount: 0, notPrintedCount: 0, noCardCount: 0 };
      this.emptyHint = 'Select a batch to load cards for printing.';
    }
  }

  onRosterFilterChange(): void {
    this.selected.clear();
    this.checkedAll = false;
    this.applyViewFilters();
  }

  onSearchChange(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.applyViewFilters(), 250);
  }

  loadRoster(): void {
    const code = (this.batchCode || '').trim();
    if (!code) {
      this.emptyHint = 'Select a batch to list every student with printed and not-printed status.';
      return;
    }

    this.loading = true;
    this.emptyHint = '';
    this.crud.getList('/student-cards/batch-roster', { batchCode: code }).subscribe({
      next: (res: any) => {
        this.loading = false;
        const payload = res?.data?.result || res?.data || res || {};
        const list = payload.students || payload.Students || [];
        this.roster = Array.isArray(list) ? list : [];
        this.summary = {
          count: Number(payload.count ?? this.roster.length) || this.roster.length,
          printedCount: Number(payload.printedCount ?? 0),
          notPrintedCount: Number(payload.notPrintedCount ?? 0),
          noCardCount: Number(payload.noCardCount ?? 0)
        };
        this.applyViewFilters();
        this.syncPreselect();
      },
      error: (err) => {
        this.loading = false;
        this.roster = [];
        this.rows = [];
        this.emptyHint = err?.error?.data || err?.error?.error || 'Failed to load batch roster.';
      }
    });
  }

  get printableCount(): number {
    return this.printableRows().length;
  }

  private applyViewFilters(): void {
    const key = (this.searchKey || '').trim().toLowerCase();
    let list = [...this.roster];
    if (this.rosterFilter === 'all') {
      list = list.filter(r => {
        const state = r.printState || r.PrintState;
        return state === 'printed' || state === 'not-printed';
      });
    } else {
      list = list.filter(r => (r.printState || r.PrintState) === this.rosterFilter);
    }
    if (key) {
      list = list.filter(r => {
        const hay = [
          r.studentId, r.StudentId, r.fullName, r.FullName,
          r.cardNumber, r.CardNumber, r.academicProgrammeCode
        ].map(v => String(v || '').toLowerCase()).join(' ');
        return hay.includes(key);
      });
    }
    this.rows = list;
    this.emptyHint = this.rows.length
      ? ''
      : (this.roster.length
        ? 'No students match the current print-state / search filter.'
        : `No students found in batch ${this.batchCode}.`);
    this.checkedAll = this.printableRows().length > 0
      && this.printableRows().every(r => this.selected.has(this.cardKey(r)));
  }

  private syncPreselect(): void {
    if (!this.preselectIds.length) {
      return;
    }
    this.preselectIds.forEach(id => {
      if (this.roster.some(r => this.cardKey(r) === id) && this.selected.size < MAX_BULK) {
        this.selected.add(id);
      }
    });
    this.preselectIds = [];
    if (this.selected.size) {
      this.openPrintPreview();
    }
  }

  cardKey(row: any): string {
    return String(row.cardId || row.CardId || '');
  }

  printStateLabel(row: any): string {
    const state = row.printState || row.PrintState;
    if (state === 'printed') {
      return `Printed ×${row.reIssueCount || row.ReIssueCount || 1}`;
    }
    if (state === 'not-printed') {
      return 'Not printed';
    }
    return 'No card issued';
  }

  printStateColor(row: any): string {
    const state = row.printState || row.PrintState;
    if (state === 'printed') {
      return 'blue';
    }
    if (state === 'not-printed') {
      return 'orange';
    }
    return 'default';
  }

  statusLabel(status: number | string): string {
    return studentCardStatusLabel(status);
  }

  statusColor(status: number | string): string {
    return studentCardStatusColor(status);
  }

  canPrint(row: any): boolean {
    const state = row.printState || row.PrintState;
    if (state === 'no-card' || !this.cardKey(row)) {
      return false;
    }
    const status = row.cardStatus ?? row.CardStatus;
    const name = String(row.cardStatusName || row.CardStatusName || '').toLowerCase();
    return status === ACTIVE_STATUS || name === 'active';
  }

  isChecked(row: any): boolean {
    const id = this.cardKey(row);
    return !!id && this.selected.has(id);
  }

  toggle(row: any, checked: boolean): void {
    const id = this.cardKey(row);
    if (!id) {
      return;
    }
    if (checked) {
      if (!this.canPrint(row)) {
        this.notify.notification('warning', 'Not printable', 'Only Active issued cards can be printed.');
        return;
      }
      if (this.selected.size >= MAX_BULK && !this.selected.has(id)) {
        this.notify.notification('warning', 'Limit', `Print at most ${MAX_BULK} cards at a time.`);
        return;
      }
      this.selected.add(id);
    } else {
      this.selected.delete(id);
    }
    const printable = this.printableRows();
    this.checkedAll = printable.length > 0 && printable.every(r => this.selected.has(this.cardKey(r)));
  }

  toggleAll(checked: boolean): void {
    const printable = this.printableRows();
    this.checkedAll = checked;
    if (!checked) {
      printable.forEach(r => this.selected.delete(this.cardKey(r)));
      return;
    }
    for (const r of printable) {
      if (this.selected.size >= MAX_BULK) {
        this.notify.notification('warning', 'Limit', `Print at most ${MAX_BULK} cards at a time.`);
        break;
      }
      this.selected.add(this.cardKey(r));
    }
    this.checkedAll = printable.length > 0 && printable.every(r => this.selected.has(this.cardKey(r)));
  }

  private printableRows(): any[] {
    return this.rows.filter(r => this.canPrint(r));
  }

  printOne(row: any): void {
    if (!this.canPrint(row)) {
      this.notify.notification('warning', 'Not printable', 'Only Active issued cards can be printed.');
      return;
    }
    this.selected.clear();
    this.selected.add(this.cardKey(row));
    this.checkedAll = false;
    this.openPrintPreview();
  }

  printSelected(): void {
    if (!this.selected.size) {
      this.notify.notification('info', 'Select cards', 'Select one or more Active issued cards to print.');
      return;
    }
    this.openPrintPreview();
  }

  goIssue(): void {
    this.router.navigateByUrl('/students/bulk-issue-student-cards');
  }

  private openPrintPreview(): void {
    const ids = Array.from(this.selected);
    if (!ids.length) {
      return;
    }
    this.preparing = true;
    this.printLoading = true;
    this.faces = [];
    this.printVisible = true;

    const requests = ids.map(id =>
      this.crud.getList(`/student-cards/${id}/preview`).pipe(
        map((res: any) => this.unwrapPayload(res)),
        catchError(() => of(null))
      )
    );

    forkJoin(requests).subscribe({
      next: async (payloads) => {
        const faces: PrintFace[] = [];
        for (let i = 0; i < payloads.length; i++) {
          const payload = payloads[i];
          if (!payload?.frontLayoutJson && !payload?.FrontLayoutJson) {
            continue;
          }
          const listRow = this.roster.find(r => this.cardKey(r) === ids[i]) || {};
          faces.push(await this.buildFace(ids[i], { ...listRow, ...payload }));
        }
        this.faces = faces;
        this.preparing = false;
        this.printLoading = false;
        if (!faces.length) {
          this.notify.notification('error', 'Error', 'Could not load any card designs for printing.');
          this.printVisible = false;
        }
      },
      error: () => {
        this.preparing = false;
        this.printLoading = false;
        this.printVisible = false;
        this.notify.notification('error', 'Error', 'Failed to prepare print preview.');
      }
    });
  }

  private unwrapPayload(res: any): any {
    const data = res?.data ?? res?.Data ?? res;
    if (!data) {
      return null;
    }
    return data.result ?? data.Result ?? data;
  }

  private async buildFace(cardId: string, payload: any): Promise<PrintFace> {
    // Print the saved template exactly — no color/weight/border rewrites.
    const frontJson = payload.frontLayoutJson || payload.FrontLayoutJson;
    const backJson = payload.backLayoutJson || payload.BackLayoutJson;
    const layout = parseCardLayout(frontJson);
    const backLayout = parseCardLayout(backJson);
    layout.elements = ensureCurrentTermOnTitle(
      stripGenderFromLayout(layout.elements).elements
    ).elements;

    const values = cardValuesFromStudentCard(payload);
    const logoRaw = cardField(payload, 'logoPath') || payload.logoPath;
    const logoHttp = this.toUrl(collegeLogoOrDefault(logoRaw));
    if (logoHttp) {
      values['college.logo'] = (await this.embedImageAsDataUrl(logoHttp)) || logoHttp;
    }
    const photoRaw = cardField(payload, 'photoPath', 'photoUrl');
    if (photoRaw) {
      const photoHttp = this.toUrl(photoRaw);
      values['student.photo'] = (await this.embedImageAsDataUrl(photoHttp)) || photoHttp;
    }

    const bg = cardField(payload, 'backgroundPath');
    const backBg = cardField(payload, 'backBackgroundPath');
    const backgroundUrl = bg ? ((await this.embedImageAsDataUrl(this.toUrl(bg))) || this.toUrl(bg)) : null;
    const backBackgroundUrl = backBg
      ? ((await this.embedImageAsDataUrl(this.toUrl(backBg))) || this.toUrl(backBg))
      : backgroundUrl;

    return {
      cardId,
      cardNumber: values['card.cardNumber'] || cardField(payload, 'cardNumber'),
      fullName: values['student.fullName'] || cardField(payload, 'fullName') || 'Student',
      studentNumber: values['student.studentNumber'] || cardField(payload, 'studentNumber', 'studentId'),
      programme: values['student.programme'],
      batch: values['student.batch'] || this.batchCode || '',
      photoUrl: values['student.photo'] || null,
      widthMm: Number(payload.widthMm || payload.WidthMm) || layout.widthMm,
      heightMm: Number(payload.heightMm || payload.HeightMm) || layout.heightMm,
      frontElements: layout.elements,
      backElements: backLayout.elements,
      values,
      backgroundUrl,
      backBackgroundUrl
    };
  }

  async doBrowserPrint(): Promise<void> {
    const sheet = document.getElementById('student-card-print-area');
    if (!sheet) {
      this.notify.notification('error', 'Error', 'Print area not ready.');
      return;
    }
    const w = this.faces[0]?.widthMm || 85.6;
    const h = this.faces[0]?.heightMm || 53.98;
    const hasBack = this.faces.some(f => !!(f.backElements && f.backElements.length));
    await this.cardPrint.waitForFaceAssets(sheet);
    await this.cardPrint.print(sheet, 'Student ID card', w, h, hasBack);
  }

  recordAndPrint(): void {
    if (!this.faces.length) {
      return;
    }
    this.printLoading = true;
    const requests = this.faces.map(face =>
      this.crud.add('/student-cards/print', {
        studentCardId: face.cardId,
        copies: 1
      }).pipe(
        map((res: any) => ({ ok: res?.status === 'success' })),
        catchError(() => of({ ok: false }))
      )
    );

    forkJoin(requests).subscribe({
      next: async (results) => {
        const ok = results.filter(r => r.ok).length;
        if (ok) {
          this.notify.notification('success', 'Print recorded', `${ok} card${ok === 1 ? '' : 's'} recorded`);
          try {
            // Drop spin blur before snapshot so capture matches the visible design.
            this.printLoading = false;
            await new Promise(resolve => setTimeout(resolve, 50));
            await this.doBrowserPrint();
          } finally {
            this.printLoading = false;
            this.loadRoster();
          }
        } else {
          this.printLoading = false;
          this.notify.notification('error', 'Error', 'Could not record prints.');
        }
      },
      error: () => {
        this.printLoading = false;
        this.notify.notification('error', 'Error', 'Bulk print failed.');
      }
    });
  }

  initials(name: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return 'ST';
    }
    return parts.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  }

  private toUrl(path: string): string {
    return resolveCardMediaUrl(path, this.fileUrl);
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
}
