import { ChangeDetectorRef, Component } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { firstValueFrom } from 'rxjs';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { StudentGradeService } from '../services/student-grade.service';

@Component({
  selector: 'app-grade-encryption-backfill',
  templateUrl: './grade-encryption-backfill.component.html',
  styleUrls: ['./grade-encryption-backfill.component.scss']
})
export class GradeEncryptionBackfillComponent {
  readonly batchPresets = [500, 1000];

  batchSize = 500;
  loading = false;
  untilDoneMode = false;
  lastUpdated: number | null = null;
  totalUpdated = 0;
  batchesCompleted = 0;
  statusText = '';

  constructor(
    private studentGradeService: StudentGradeService,
    private notify: CustomNotificationService,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef
  ) {}

  get hasResults(): boolean {
    return this.lastUpdated !== null || this.loading;
  }

  setPreset(size: number): void {
    if (!this.loading) {
      this.batchSize = size;
    }
  }

  runOnce(): void {
    void this.runBackfill(false);
  }

  confirmRunUntilDone(): void {
    if (this.loading) {
      return;
    }

    this.modal.confirm({
      nzTitle: 'Run until done?',
      nzContent: 'This encrypts every remaining plaintext grade row in batches. Progress updates after each batch.',
      nzOkText: 'Continue',
      nzOkType: 'primary',
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        void this.runBackfill(true);
      }
    });
  }

  private async runBackfill(untilDone: boolean): Promise<void> {
    const size = this.normalizeBatchSize(this.batchSize);
    this.batchSize = size;
    this.loading = true;
    this.untilDoneMode = untilDone;
    this.statusText = untilDone ? 'Starting…' : `Running one batch of ${size}…`;
    this.cdr.detectChanges();

    try {
      if (!untilDone) {
        const res = await firstValueFrom(
          this.studentGradeService.backfillProtectedGradeFields(size, false)
        );
        this.lastUpdated = Number(res?.updated ?? 0);
        this.totalUpdated += this.lastUpdated;
        this.batchesCompleted += 1;
        this.statusText = '';
        if (this.lastUpdated === 0) {
          this.notify.notification('success', 'Done', 'No remaining rows to protect.');
        } else {
          this.notify.notification('success', 'Batch complete', `Protected ${this.lastUpdated} row(s).`);
        }
        return;
      }

      // Loop one batch per request so the browser/API do not time out on a single long call.
      let sessionTotal = 0;
      let batches = 0;
      while (true) {
        this.statusText = `Batch ${batches + 1}… protected ${sessionTotal.toLocaleString()} so far`;
        this.cdr.detectChanges();

        const res = await firstValueFrom(
          this.studentGradeService.backfillProtectedGradeFields(size, false)
        );
        const updated = Number(res?.updated ?? 0);
        this.lastUpdated = updated;
        sessionTotal += updated;
        this.totalUpdated += updated;
        batches += 1;
        this.batchesCompleted += 1;
        this.cdr.detectChanges();

        if (updated === 0) {
          break;
        }
      }

      this.statusText = '';
      if (sessionTotal === 0) {
        this.notify.notification('success', 'Done', 'No remaining rows to protect.');
      } else {
        this.notify.notification(
          'success',
          'Done',
          `Protected ${sessionTotal.toLocaleString()} row(s) across ${batches} batch(es).`
        );
      }
    } catch (err: any) {
      this.statusText = '';
      this.notify.notification(
        'error',
        'Error',
        err?.error?.message || err?.error?.error || err?.message || 'Backfill failed.'
      );
    } finally {
      this.loading = false;
      this.untilDoneMode = false;
      this.cdr.detectChanges();
    }
  }

  resetTotals(): void {
    if (this.loading) {
      return;
    }
    this.lastUpdated = null;
    this.totalUpdated = 0;
    this.batchesCompleted = 0;
    this.statusText = '';
  }

  private normalizeBatchSize(value: number): number {
    const size = Number(value);
    if (!Number.isFinite(size) || size < 1) {
      return 500;
    }
    // Server caps at 1000 to avoid SQL timeouts on encrypt + save.
    return Math.min(Math.floor(size), 1000);
  }
}
