import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-bulk-issue-student-cards',
  templateUrl: './bulk-issue-student-cards.component.html',
  styleUrls: ['./bulk-issue-student-cards.component.scss']
})
export class BulkIssueStudentCardsComponent implements OnInit, OnDestroy {
  saving = false;
  loadingBatches = false;
  loadingStudents = false;
  loadingTemplates = false;
  batches: any[] = [];
  students: any[] = [];
  templates: any[] = [];
  created: any[] = [];
  skipped: any[] = [];
  checkedAll = false;
  lastIssuedBatch: string | null = null;
  private eligibleSub?: Subscription;

  form = this.fb.group({
    batchCode: [null as string | null, Validators.required],
    cardTemplateId: [null as string | null],
    studentIds: [[] as string[]],
    activateImmediately: [true],
    remark: ['']
  });

  constructor(
    private fb: FormBuilder,
    private crud: CrudService,
    private notify: CustomNotificationService,
    private router: Router
  ) {
    this.form.get('batchCode')?.valueChanges.subscribe(code => {
      this.form.patchValue({ studentIds: [] }, { emitEvent: false });
      this.checkedAll = false;
      this.students = [];
      this.created = [];
      this.skipped = [];
      this.lastIssuedBatch = null;
      if (code) {
        this.loadEligible(code);
      }
    });
  }

  ngOnInit(): void {
    this.loadBatches();
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.eligibleSub?.unsubscribe();
  }

  loadTemplates(): void {
    this.loadingTemplates = true;
    this.crud.getList('/card-templates').subscribe({
      next: (res: any) => {
        this.loadingTemplates = false;
        const rows = Array.isArray(res) ? res : (res?.data || []);
        this.templates = (Array.isArray(rows) ? rows : []).filter((t: any) => t.isActive !== false);
        const preferred = this.templates.find((t: any) => t.isDefault) || this.templates[0];
        if (preferred?.id && !this.form.value.cardTemplateId) {
          this.form.patchValue({ cardTemplateId: preferred.id }, { emitEvent: false });
        }
      },
      error: () => {
        this.loadingTemplates = false;
        this.templates = [];
      }
    });
  }

  templateLabel(t: any): string {
    const name = t.name || 'Template';
    return t.isDefault ? `${name} (Default)` : name;
  }

  loadBatches(): void {
    this.loadingBatches = true;
    this.crud.getList('/batchs').subscribe({
      next: (res: any) => {
        this.loadingBatches = false;
        const rows = Array.isArray(res) ? res : (res?.data || []);
        this.batches = (Array.isArray(rows) ? rows : [])
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
        this.notify.notification('error', 'Error', 'Failed to load batches');
      }
    });
  }

  loadEligible(batchCode: string): void {
    this.eligibleSub?.unsubscribe();
    this.loadingStudents = true;
    this.eligibleSub = this.crud.getList('/student-cards/eligible', { batchCode }).subscribe({
      next: (res: any) => {
        this.loadingStudents = false;
        const payload = res?.data?.result || res?.data || {};
        const rows = payload.students || payload || [];
        this.students = Array.isArray(rows) ? rows : [];
        const ids: string[] = this.students
          .map(s => this.studentGuid(s))
          .filter((x): x is string => !!x);
        this.form.patchValue({ studentIds: ids }, { emitEvent: false });
        this.checkedAll = ids.length > 0;
      },
      error: (err) => {
        this.loadingStudents = false;
        this.students = [];
        this.notify.notification(
          'error',
          'Error',
          err?.error?.data || err?.error?.error || 'Failed to load students'
        );
      }
    });
  }

  get selectedCount(): number {
    return (this.form.value.studentIds || []).length;
  }

  studentName(s: any): string {
    return s.fullName
      || [s.firstName, s.fatherName, s.grandFatherName].filter(Boolean).join(' ')
      || '—';
  }

  studentGuid(s: any): string {
    return s.id || s.ID || s.studentGuid || '';
  }

  isChecked(id: string): boolean {
    return ((this.form.value.studentIds || []) as string[]).includes(id);
  }

  toggleStudent(id: string, checked: boolean): void {
    const current = new Set<string>((this.form.value.studentIds || []) as string[]);
    if (checked) {
      current.add(id);
    } else {
      current.delete(id);
    }
    const ids: string[] = Array.from(current);
    this.form.patchValue({ studentIds: ids }, { emitEvent: false });
    this.checkedAll = this.students.length > 0 && ids.length === this.students.length;
  }

  toggleAll(checked: boolean): void {
    this.checkedAll = checked;
    const ids: string[] = checked
      ? this.students.map(s => this.studentGuid(s)).filter((x): x is string => !!x)
      : [];
    this.form.patchValue({ studentIds: ids }, { emitEvent: false });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const batchCode = (value.batchCode || '').trim();
    const ids = ((value.studentIds || []) as string[]).filter(Boolean);

    if (!batchCode || !ids.length) {
      this.notify.notification('error', 'Error', 'Select a batch and at least one student');
      return;
    }

    this.saving = true;
    this.created = [];
    this.skipped = [];
    this.crud.add('/student-cards/bulk-issue', {
      batchCode,
      cardTemplateId: value.cardTemplateId || null,
      studentIds: ids,
      dryRun: false,
      activateImmediately: !!value.activateImmediately,
      remark: value.remark || null
    }).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res?.status === 'success') {
          const data = res?.data?.result || res?.data || {};
          this.created = data.created || [];
          this.skipped = data.skipped || [];
          this.lastIssuedBatch = batchCode;
          this.notify.notification(
            'success',
            'Issued',
            `Issued ${data.createdCount || 0} card(s)`
          );
          if ((data.createdCount || 0) > 0) {
            this.loadEligible(batchCode);
          }
        } else {
          this.notify.notification('error', 'Error', res?.data || res?.error || 'Bulk issue failed');
        }
      },
      error: (err) => {
        this.saving = false;
        this.notify.notification('error', 'Error', err?.error?.data || err?.error?.error || 'Bulk issue failed');
      }
    });
  }

  goToBulkPrint(): void {
    const batch = this.lastIssuedBatch || this.form.value.batchCode;
    const ids = this.created
      .map(row => row.id || row.ID || row.iD)
      .filter(Boolean)
      .slice(0, 40);
    const query: any = {};
    if (batch) {
      query.batch = batch;
    }
    if (ids.length) {
      query.ids = ids.join(',');
    }
    this.router.navigate(['/students/card-print-center'], { queryParams: query });
  }
}
