import { Component, Input, OnInit } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { ACADEMIC_TERM_STATUS, ACADEMIC_YEAR_NUMBER_STATUS } from 'src/app/common/constant';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { BatchTermService } from '../services/batch-term.service';

@Component({
  selector: 'app-manage-batch-term',
  templateUrl: './manage-batch-term.component.html',
  styleUrls: ['./manage-batch-term.component.scss']
})
export class ManageBatchTermComponent implements OnInit {
  @Input() batchId: string;
  @Input() batchCode: string;

  loading = false;
  savingId: number | null = null;
  batchTerms: any[] = [];
  termOptions = ACADEMIC_TERM_STATUS;
  yearOptions = ACADEMIC_YEAR_NUMBER_STATUS;

  constructor(
    private modalRef: NzModalRef,
    private batchTermService: BatchTermService,
    private notify: CustomNotificationService
  ) {}

  ngOnInit(): void {
    this.loadTerms();
  }

  loadTerms(): void {
    if (!this.batchId) {
      return;
    }
    this.loading = true;
    this.batchTermService.getBatchTermsByBatchId(this.batchId).subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res) ? res : (res?.data || []);
        this.batchTerms = rows || [];
        this.loading = false;
      },
      error: () => {
        this.batchTerms = [];
        this.loading = false;
        this.notify.notification('error', 'Error', 'Failed to load batch terms.');
      }
    });
  }

  getTermName(id: number): string {
    const match = this.termOptions.find(t => t.Id == id);
    return match ? match.Description : String(id || '');
  }

  getYearName(id: number): string {
    const match = this.yearOptions.find(y => y.Id == id);
    return match ? match.Description : String(id || '');
  }

  saveRow(row: any): void {
    if (!row?.id) {
      return;
    }
    this.savingId = row.id;
    this.batchTermService
      .updateBatchTerm(row.id, {
        academicTermId: row.academicTermId,
        academicYear: row.academicYear,
        academicTerm: row.academicTerm
      })
      .subscribe({
        next: (res: any) => {
          this.savingId = null;
          if (res?.status === 'success' || res === 'success') {
            this.notify.notification('success', 'Success', res?.data || 'Batch term updated.');
            this.loadTerms();
          } else {
            this.notify.notification('error', 'Error', res?.data || 'Update failed.');
          }
        },
        error: (err) => {
          this.savingId = null;
          this.notify.notification(
            'error',
            'Error',
            err?.error?.data || 'Failed to update batch term.'
          );
        }
      });
  }

  close(): void {
    this.modalRef.close();
  }
}
