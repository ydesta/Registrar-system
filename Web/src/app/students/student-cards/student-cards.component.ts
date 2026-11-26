import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
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
import {
  STUDENT_CARD_STATUS_OPTIONS,
  studentCardActionLabel,
  studentCardStatusColor,
  studentCardStatusLabel
} from '../shared/card-status.util';
import { StudentCardPrintService } from '../shared/student-card-print.service';

@Component({
  selector: 'app-student-cards',
  templateUrl: './student-cards.component.html',
  styleUrls: ['./student-cards.component.scss']
})
export class StudentCardsComponent implements OnInit, OnDestroy {
  cards: any[] = [];
  pager: ServerPaginator;
  statusFilter: number | null = null;
  readonly statusOptions = STUDENT_CARD_STATUS_OPTIONS;
  detail: any = null;
  activity: any[] = [];
  detailVisible = false;
  printVisible = false;
  expiringDue = false;
  detailModalWidth: number | string = 720;
  printModalWidth: number | string = 640;
  detailWidthMm = 85.6;
  detailHeightMm = 53.98;
  detailElements: DesignElement[] = [];
  detailValues: Record<string, string> = {};
  detailBackgroundUrl: string | null = null;
  printWidthMm = 85.6;
  printHeightMm = 53.98;
  printElements: DesignElement[] = [];
  printBackElements: DesignElement[] = [];
  printValues: Record<string, string> = {};
  printBackgroundUrl: string | null = null;
  printBackBackgroundUrl: string | null = null;
  printCard: any = null;
  printTemplates: any[] = [];
  selectedPrintTemplateId: string | null = null;
  persistPrintTemplate = false;
  printLoading = false;
  printPhotoUrl: string | null = null;
  selectedIds = new Set<string>();
  checkedAll = false;
  private readonly fileUrl = environment.fileUrl;
  private readonly activeStatus = 2;

  constructor(
    private crud: CrudService,
    private modal: NzModalService,
    private notify: CustomNotificationService,
    private paginator: PaginatorService,
    private router: Router,
    private cardPrint: StudentCardPrintService
  ) {
    this.pager = this.paginator.create();
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  ngOnInit(): void {
    this.pager.init(() => this.load());
    this.load();
    this.updateModalWidths();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    this.pager.destroy();
    window.removeEventListener('resize', this.onResize);
  }

  private readonly onResize = (): void => this.updateModalWidths();

  private updateModalWidths(): void {
    const w = window.innerWidth || 1200;
    this.detailModalWidth = w < 768 ? '95%' : 720;
    this.printModalWidth = w < 768 ? '95%' : 560;
  }

  load(): void {
    this.pager.loading = true;
    const extra = this.statusFilter == null ? undefined : { status: this.statusFilter };
    this.crud.getPaginated('/student-cards', this.pager.query(extra)).subscribe({
      next: (res: any) => {
        this.cards = res?.data || [];
        this.pager.applyResult(res);
        this.pruneSelection();
      },
      error: (err) => {
        this.cards = [];
        this.pager.fail();
        this.notify.notification(
          'error',
          'Error',
          err?.error?.data || err?.error?.error || err?.error?.message || 'Failed to load student cards'
        );
      }
    });
  }

  onStatusFilterChange(): void {
    this.pager.onFilterChange();
  }

  statusLabel(status: number | string): string {
    return studentCardStatusLabel(status);
  }

  statusColor(status: number | string): string {
    return studentCardStatusColor(status);
  }

  actionLabel(action: number | string): string {
    return studentCardActionLabel(action);
  }

  openDetail(card: any): void {
    this.detailVisible = true;
    this.detail = card;
    this.activity = [];
    this.detailElements = [];
    this.detailValues = {};
    this.detailBackgroundUrl = null;
    this.crud.getList(`/student-cards/${card.id}/activity`).subscribe({
      next: (res: any) => {
        this.activity = res?.data || [];
      }
    });
    this.crud.getList(`/student-cards/${card.id}/preview`).subscribe({
      next: (res: any) => {
        const payload = res?.data || res;
        if (!payload) {
          return;
        }
        this.applyFacePayload(payload, 'detail');
      }
    });
  }

  private postAction(path: string, cardId: string, remark?: string, okMessage = 'Updated'): void {
    this.crud.add(`/student-cards/${path}`, {
      studentCardId: cardId,
      remark: remark || null
    }).subscribe({
      next: (res: any) => {
        if (res?.status === 'success') {
          this.notify.notification('success', 'Success', okMessage);
          this.load();
        } else {
          this.notify.notification('error', 'Error', res?.data || res?.error || 'Failed');
        }
      },
      error: (err) => {
        this.notify.notification('error', 'Error', err?.error?.data || err?.error?.error || 'Request failed');
      }
    });
  }

  confirm(action: string, card: any, title: string, remarkRequired = false): void {
    if (remarkRequired) {
      let remark = '';
      this.modal.confirm({
        nzTitle: title,
        nzContent: 'Optional remark can be added in the next step if needed.',
        nzOkText: 'Continue',
        nzOnOk: () => {
          this.modal.create({
            nzTitle: 'Remark',
            nzContent: `<input id="card-remark" class="ant-input" placeholder="Remark" />`,
            nzOnOk: () => {
              const el = document.getElementById('card-remark') as HTMLInputElement | null;
              remark = el?.value || '';
              this.postAction(action, card.id, remark);
            }
          });
        }
      });
      return;
    }

    this.modal.confirm({
      nzTitle: title,
      nzOkText: 'Yes',
      nzOnOk: () => this.postAction(action, card.id)
    });
  }

  activate(card: any): void {
    this.confirm('activate', card, 'Activate this card?');
  }

  suspend(card: any): void {
    this.confirm('suspend', card, 'Suspend this card?', true);
  }

  reinstate(card: any): void {
    this.confirm('reinstate', card, 'Reinstate this card?');
  }

  markLost(card: any): void {
    this.confirm('mark-lost', card, 'Mark this card as lost?', true);
  }

  renew(card: any): void {
    this.confirm('renew', card, 'Renew this card (extend expiry)?');
  }

  cancel(card: any): void {
    this.confirm('cancel', card, 'Cancel this card?', true);
  }

  replace(card: any): void {
    this.modal.confirm({
      nzTitle: 'Replace this card with a new one?',
      nzOkText: 'Replace',
      nzOkDanger: true,
      nzOnOk: () => {
        this.crud.add('/student-cards/replace', {
          studentCardId: card.id,
          activateImmediately: true,
          photoPath: card.photoPath,
          photoFileId: card.photoFileId
        }).subscribe({
          next: (res: any) => {
            if (res?.status === 'success') {
              this.notify.notification('success', 'Success', 'Card replaced');
              this.load();
            } else {
              this.notify.notification('error', 'Error', res?.data || res?.error || 'Replace failed');
            }
          },
          error: (err) => {
            this.notify.notification('error', 'Error', err?.error?.data || 'Replace failed');
          }
        });
      }
    });
  }

  preview(card: any): void {
    this.openDesignChooser(card);
  }

  print(card: any): void {
    this.openDesignChooser(card);
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  toggleSelect(card: any, checked: boolean): void {
    if (checked) {
      if (card.status !== this.activeStatus && this.statusLabel(card.status).toLowerCase() !== 'active') {
        this.notify.notification('warning', 'Not printable', 'Only active cards can be printed.');
        return;
      }
      this.selectedIds.add(card.id);
    } else {
      this.selectedIds.delete(card.id);
    }
    this.checkedAll = this.cards.length > 0 && this.cards.every(c => this.selectedIds.has(c.id));
  }

  toggleAll(checked: boolean): void {
    this.checkedAll = checked;
    if (!checked) {
      this.cards.forEach(c => this.selectedIds.delete(c.id));
      return;
    }
    this.cards.forEach(c => {
      const active = c.status === this.activeStatus || this.statusLabel(c.status).toLowerCase() === 'active';
      if (active) {
        this.selectedIds.add(c.id);
      }
    });
    this.checkedAll = this.cards.length > 0 && this.cards.every(c => this.selectedIds.has(c.id));
  }

  printSelected(): void {
    const ids = Array.from(this.selectedIds);
    if (!ids.length) {
      this.notify.notification('info', 'Select cards', 'Select one or more active cards to print.');
      return;
    }
    this.router.navigate(['/students/card-print-center'], {
      queryParams: { ids: ids.join(',') }
    });
  }

  private pruneSelection(): void {
    const valid = new Set(this.cards.map(c => c.id));
    Array.from(this.selectedIds).forEach(id => {
      if (!valid.has(id)) {
        this.selectedIds.delete(id);
      }
    });
    this.checkedAll = this.cards.length > 0 && this.cards.every(c => this.selectedIds.has(c.id));
  }

  /** Open print preview; pick default or any alternate design for this print. */
  private openDesignChooser(card: any): void {
    this.printCard = card;
    this.persistPrintTemplate = false;
    this.printLoading = true;
    this.printVisible = true;
    this.printTemplates = [];
    this.selectedPrintTemplateId = card.cardTemplateId || null;

    const loadPreview = (templateId?: string | null) => {
      this.printLoading = true;
      const q = templateId ? `?templateId=${encodeURIComponent(templateId)}` : '';
      this.crud.getList(`/student-cards/${card.id}/preview${q}`).subscribe({
        next: (res: any) => {
          this.printLoading = false;
          const payload = res?.data || res;
          if (!payload) {
            this.notify.notification('error', 'Error', 'Preview not available');
            return;
          }
          this.selectedPrintTemplateId = payload.templateId || this.selectedPrintTemplateId;
          this.openPrintPreview(payload);
        },
        error: (err) => {
          this.printLoading = false;
          this.notify.notification('error', 'Error', err?.error?.data || 'Preview failed');
        }
      });
    };

    const cardTypeId = card.cardTypeId;
    if (cardTypeId) {
      this.crud.getList(`/student-cards/types/${cardTypeId}/templates`).subscribe({
        next: (res: any) => {
          const list = (res?.data || []).filter((t: any) => t.isActive !== false);
          this.printTemplates = list;
          // Prefer the card's assigned design, else the type default, else first active.
          const def =
            list.find((t: any) => t.id === card.cardTemplateId) ||
            list.find((t: any) => t.isDefault) ||
            list[0];
          this.selectedPrintTemplateId = def?.id || card.cardTemplateId || null;
          loadPreview(this.selectedPrintTemplateId);
        },
        error: () => loadPreview(this.selectedPrintTemplateId)
      });
    } else {
      loadPreview(this.selectedPrintTemplateId);
    }
  }

  onPrintTemplateChange(templateId: string): void {
    this.selectedPrintTemplateId = templateId;
    if (!this.printCard?.id) {
      return;
    }
    this.printLoading = true;
    const q = templateId ? `?templateId=${encodeURIComponent(templateId)}` : '';
    this.crud.getList(`/student-cards/${this.printCard.id}/preview${q}`).subscribe({
      next: (res: any) => {
        this.printLoading = false;
        const payload = res?.data || res;
        if (payload) {
          this.openPrintPreview(payload);
        }
      },
      error: (err) => {
        this.printLoading = false;
        this.notify.notification('error', 'Error', err?.error?.data || 'Failed to load design');
      }
    });
  }

  templateOptionLabel(t: any): string {
    const name = t?.name || 'Design';
    return t?.isDefault ? `${name} (Default)` : name;
  }

  recordAndPrint(): void {
    if (!this.printCard?.id) {
      return;
    }
    // Keep the already-painted preview — do not re-bind faces (that races logos/QR).
    this.printLoading = true;
    this.crud.add('/student-cards/print', {
      studentCardId: this.printCard.id,
      copies: 1,
      cardTemplateId: this.selectedPrintTemplateId,
      persistTemplateChoice: this.persistPrintTemplate
    }).subscribe({
      next: async (res: any) => {
        if (res?.status === 'success') {
          const payload = res?.data?.result || res?.data;
          this.notify.notification(
            'success',
            'Success',
            `Print recorded (reprints: ${payload?.reIssueCount ?? ''})`
          );
          this.load();
          try {
            // Clear fade overlay before snapshot so capture matches the visible design.
            this.printLoading = false;
            await new Promise(resolve => setTimeout(resolve, 50));
            await this.doBrowserPrint();
          } finally {
            this.printLoading = false;
          }
        } else {
          this.printLoading = false;
          this.notify.notification('error', 'Error', res?.data || res?.error || 'Print failed');
        }
      },
      error: (err) => {
        this.printLoading = false;
        this.notify.notification('error', 'Error', err?.error?.data || 'Print failed');
      }
    });
  }

  copyScanLink(card: any): void {
    const token = card?.qrToken;
    if (!token) {
      return;
    }
    const url = `${window.location.origin}/card-scan/${encodeURIComponent(token)}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => this.notify.notification('success', 'Copied', 'Public scan link copied'),
        () => this.notify.notification('info', 'Scan link', url)
      );
    } else {
      this.notify.notification('info', 'Scan link', url);
    }
  }

  openPrintPreview(payload: any): void {
    this.applyFacePayload(payload, 'print');
    this.printVisible = true;
  }

  private applyFacePayload(payload: any, target: 'print' | 'detail'): void {
    const merged = target === 'print' && this.printCard
      ? { ...this.printCard, ...payload }
      : payload;
    // Render the saved template exactly — no color/weight/border rewrites.
    const frontJson = merged.frontLayoutJson || merged.FrontLayoutJson;
    const backJson = merged.backLayoutJson || merged.BackLayoutJson;
    const layout = parseCardLayout(frontJson);
    const backLayout = parseCardLayout(backJson);
    layout.elements = ensureCurrentTermOnTitle(
      stripGenderFromLayout(layout.elements).elements
    ).elements;
    const values = cardValuesFromStudentCard(merged);
    const logoHttp = this.toUrl(collegeLogoOrDefault(cardField(merged, 'logoPath') || merged.logoPath));
    if (logoHttp) {
      values['college.logo'] = logoHttp;
    }
    const photoRaw = cardField(merged, 'photoPath', 'photoUrl');
    if (photoRaw) {
      values['student.photo'] = this.toUrl(photoRaw);
    }
    const backgroundUrl = cardField(merged, 'backgroundPath')
      ? this.toUrl(cardField(merged, 'backgroundPath'))
      : null;
    const backBackgroundUrl = cardField(merged, 'backBackgroundPath')
      ? this.toUrl(cardField(merged, 'backBackgroundPath'))
      : backgroundUrl;

    const assign = (finalValues: Record<string, string>, bg = backgroundUrl, backBg = backBackgroundUrl) => {
      if (target === 'print') {
        this.printWidthMm = Number(merged.widthMm || merged.WidthMm) || layout.widthMm;
        this.printHeightMm = Number(merged.heightMm || merged.HeightMm) || layout.heightMm;
        this.printElements = layout.elements;
        this.printBackElements = backLayout.elements;
        this.printValues = finalValues;
        this.printBackgroundUrl = bg;
        this.printBackBackgroundUrl = backBg;
        this.printPhotoUrl = finalValues['student.photo'] || null;
      } else {
        this.detailWidthMm = Number(merged.widthMm || merged.WidthMm) || layout.widthMm;
        this.detailHeightMm = Number(merged.heightMm || merged.HeightMm) || layout.heightMm;
        this.detailElements = layout.elements;
        this.detailValues = finalValues;
        this.detailBackgroundUrl = bg;
      }
    };

    assign({ ...values });

    // Embed images as data URLs so print/preview does not depend on cross-origin file URLs.
    const embedJobs: Array<Promise<void>> = [];
    if (logoHttp) {
      embedJobs.push(this.embedImageAsDataUrl(logoHttp).then(dataUrl => {
        if (dataUrl) {
          values['college.logo'] = dataUrl;
        }
      }));
    }
    if (values['student.photo']) {
      embedJobs.push(this.embedImageAsDataUrl(values['student.photo']).then(dataUrl => {
        if (dataUrl) {
          values['student.photo'] = dataUrl;
        }
      }));
    }
    let nextBg = backgroundUrl;
    let nextBackBg = backBackgroundUrl;
    if (backgroundUrl) {
      embedJobs.push(this.embedImageAsDataUrl(backgroundUrl).then(dataUrl => {
        if (dataUrl) {
          nextBg = dataUrl;
        }
      }));
    }
    if (backBackgroundUrl && backBackgroundUrl !== backgroundUrl) {
      embedJobs.push(this.embedImageAsDataUrl(backBackgroundUrl).then(dataUrl => {
        if (dataUrl) {
          nextBackBg = dataUrl;
        }
      }));
    }
    Promise.all(embedJobs).then(() => {
      if (backBackgroundUrl === backgroundUrl) {
        nextBackBg = nextBg;
      }
      assign({ ...values }, nextBg, nextBackBg);
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

  private toUrl(path: string): string {
    return resolveCardMediaUrl(path, this.fileUrl);
  }

  async doBrowserPrint(): Promise<void> {
    const sheet = document.getElementById('student-card-print-area');
    if (!sheet || !this.printElements.length) {
      this.notify.notification('error', 'Error', 'Print area not ready.');
      return;
    }
    await this.cardPrint.waitForFaceAssets(sheet);
    await this.cardPrint.print(
      sheet,
      'Student ID card',
      this.printWidthMm,
      this.printHeightMm,
      !!this.printBackElements.length
    );
  }

  expireDue(): void {
    this.modal.confirm({
      nzTitle: 'Expire all cards past their expiry date?',
      nzOkText: 'Run',
      nzOnOk: () => {
        this.expiringDue = true;
        this.crud.add('/student-cards/expire-due', {}, { take: 100 }).subscribe({
          next: (res: any) => {
            this.expiringDue = false;
            if (res?.status === 'success') {
              const data = res?.data || {};
              this.notify.notification(
                'success',
                'Success',
                `Expired ${data.expired ?? 0} of ${data.examined ?? 0} due cards`
              );
              this.load();
            } else {
              this.notify.notification('error', 'Error', res?.data || res?.error || 'Expire due failed');
            }
          },
          error: (err) => {
            this.expiringDue = false;
            this.notify.notification('error', 'Error', err?.error?.data || 'Expire due failed');
          }
        });
      }
    });
  }
}
