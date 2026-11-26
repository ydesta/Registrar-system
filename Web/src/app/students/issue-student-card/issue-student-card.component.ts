import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { environment } from 'src/environments/environment';
import {
  cardValuesFromStudentCard,
  collegeLogoOrDefault,
  ensureCurrentTermOnTitle,
  ensureHeaderLogo,
  ensureLandscapeSignature,
  fixPortraitBackDateVisibility,
  parseCardLayout,
  resolveCardMediaUrl,
  stripGenderFromLayout,
  stripPortraitDetailsAccent,
  upgradeAccentColors,
  upgradeCardSpacing,
  upgradeQrToDataFields
} from '../card-template-designer/card-layout.model';
import { DesignElement } from '../card-template-designer/design-element.model';
import { StudentService } from '../services/student.service';

@Component({
  selector: 'app-issue-student-card',
  templateUrl: './issue-student-card.component.html',
  styleUrls: ['./issue-student-card.component.scss']
})
export class IssueStudentCardComponent implements OnInit {
  saving = false;
  previewLoading = false;
  loadingBatches = false;
  loadingStudents = false;
  loadingTemplates = false;
  photoPreview: string | null = null;
  batches: any[] = [];
  students: any[] = [];
  templates: any[] = [];

  faceWidthMm = 85.6;
  faceHeightMm = 53.98;
  frontElements: DesignElement[] = [];
  backElements: DesignElement[] = [];
  faceValues: Record<string, string> = {};
  frontBackgroundUrl: string | null = null;
  backBackgroundUrl: string | null = null;

  form = this.fb.group({
    batchCode: [null as string | null, Validators.required],
    studentId: [null as string | null, Validators.required],
    cardTemplateId: [null as string | null],
    photoPath: [''],
    remark: [''],
    activateImmediately: [true]
  });

  constructor(
    private fb: FormBuilder,
    private crud: CrudService,
    private studentsApi: StudentService,
    private notify: CustomNotificationService,
    private router: Router
  ) {
    this.form.get('batchCode')?.valueChanges.subscribe(code => {
      this.form.patchValue({ studentId: null, photoPath: '' }, { emitEvent: false });
      this.photoPreview = null;
      this.students = [];
      this.clearPreview();
      if (code) {
        this.loadEligible(code);
      }
    });

    this.form.get('studentId')?.valueChanges.subscribe(id => {
      this.onStudentSelected(id);
      this.refreshPreview();
    });

    this.form.get('cardTemplateId')?.valueChanges.subscribe(() => this.refreshPreview());
  }

  ngOnInit(): void {
    this.loadBatches();
    this.loadTemplates();
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

  loadTemplates(): void {
    this.loadingTemplates = true;
    this.crud.getList('/card-templates').subscribe({
      next: (res: any) => {
        this.loadingTemplates = false;
        const rows = Array.isArray(res) ? res : (res?.data || []);
        this.templates = (Array.isArray(rows) ? rows : []).filter((t: any) => t.isActive !== false);
        const preferred = this.templates.find((t: any) => t.isDefault) || this.templates[0];
        if (preferred?.id && !this.form.value.cardTemplateId) {
          this.form.patchValue({ cardTemplateId: preferred.id }, { emitEvent: true });
        }
      },
      error: () => {
        this.loadingTemplates = false;
        this.templates = [];
      }
    });
  }

  loadEligible(batchCode: string): void {
    this.loadingStudents = true;
    this.crud.getList('/student-cards/eligible', { batchCode }).subscribe({
      next: (res: any) => {
        this.loadingStudents = false;
        const payload = res?.data?.result || res?.data || {};
        const rows = payload.students || payload || [];
        this.students = Array.isArray(rows) ? rows : [];
        if (!this.students.length) {
          this.notify.notification(
            'info',
            'No students',
            'No students without a card were found for this batch.'
          );
        }
      },
      error: (err) => {
        this.loadingStudents = false;
        this.students = [];
        this.notify.notification(
          'error',
          'Error',
          err?.error?.data || err?.error?.error || 'Failed to load eligible students'
        );
      }
    });
  }

  studentLabel(s: any): string {
    const id = s.studentId || s.StudentId || '';
    const name = s.fullName
      || [s.firstName, s.fatherName, s.grandFatherName].filter(Boolean).join(' ')
      || '';
    return `${id} — ${name}`.trim();
  }

  studentGuid(s: any): string {
    return s.id || s.ID || s.studentGuid || '';
  }

  templateLabel(t: any): string {
    const name = t.name || 'Template';
    return t.isDefault ? `${name} (Default)` : name;
  }

  private onStudentSelected(studentGuid: string | null): void {
    this.photoPreview = null;
    this.form.patchValue({ photoPath: '' }, { emitEvent: false });
    if (!studentGuid) {
      return;
    }

    this.studentsApi.getListStudentProfileByStudentId(studentGuid).subscribe({
      next: (res: any) => {
        const photo = res?.photoUrl || res?.PhotoUrl || '';
        if (!photo) {
          this.refreshPreview();
          return;
        }
        const path = this.toPhotoPath(photo);
        this.form.patchValue({ photoPath: path }, { emitEvent: false });
        this.photoPreview = this.toPreviewUrl(path);
        this.refreshPreview();
      },
      error: () => this.refreshPreview()
    });
  }

  refreshPreview(): void {
    const studentId = this.form.value.studentId;
    if (!studentId) {
      this.clearPreview();
      return;
    }

    this.previewLoading = true;
    this.crud.add('/student-cards/preview-draft', {
      studentId,
      cardTemplateId: this.form.value.cardTemplateId || null,
      photoPath: this.form.value.photoPath || null
    }).subscribe({
      next: (res: any) => {
        this.previewLoading = false;
        if (res?.status !== 'success') {
          this.clearPreview();
          return;
        }
        const payload = res?.data?.result || res?.data || {};
        this.applyPreviewPayload(payload);
      },
      error: () => {
        this.previewLoading = false;
        this.clearPreview();
      }
    });
  }

  private applyPreviewPayload(payload: any): void {
    if (!payload?.frontLayoutJson) {
      this.clearPreview();
      return;
    }
    const layout = parseCardLayout(payload.frontLayoutJson);
    const backLayout = parseCardLayout(payload.backLayoutJson);
    layout.elements = stripPortraitDetailsAccent(
      upgradeAccentColors(
        ensureLandscapeSignature(
          ensureCurrentTermOnTitle(
            stripGenderFromLayout(
              upgradeCardSpacing(
                ensureHeaderLogo(upgradeQrToDataFields(layout.elements).elements).elements
              ).elements
            ).elements
          ).elements
        ).elements
      ).elements
    );
    backLayout.elements = fixPortraitBackDateVisibility(
      upgradeAccentColors(upgradeQrToDataFields(backLayout.elements).elements).elements
    ).elements;

    this.faceWidthMm = payload.widthMm || layout.widthMm;
    this.faceHeightMm = payload.heightMm || layout.heightMm;
    this.frontElements = layout.elements;
    this.backElements = backLayout.elements;

    const values = cardValuesFromStudentCard(payload);
    const logoHttp = this.toUrl(collegeLogoOrDefault(payload.logoPath));
    if (logoHttp) {
      values['college.logo'] = logoHttp;
    }
    if (payload.photoPath) {
      values['student.photo'] = this.toUrl(payload.photoPath);
    }
    this.faceValues = { ...values };
    this.frontBackgroundUrl = payload.backgroundPath ? this.toUrl(payload.backgroundPath) : null;
    this.backBackgroundUrl = payload.backBackgroundPath
      ? this.toUrl(payload.backBackgroundPath)
      : this.frontBackgroundUrl;

    if (logoHttp) {
      this.embedImageAsDataUrl(logoHttp).then(dataUrl => {
        if (dataUrl) {
          this.faceValues = { ...values, 'college.logo': dataUrl };
        }
      });
    }
  }

  private clearPreview(): void {
    this.frontElements = [];
    this.backElements = [];
    this.faceValues = {};
    this.frontBackgroundUrl = null;
    this.backBackgroundUrl = null;
  }

  private toPhotoPath(raw: string): string {
    const path = String(raw).trim().replace(/\\/g, '/');
    if (/^https?:\/\//i.test(path) || path.startsWith('data:')) {
      return path;
    }
    if (/^Resources\//i.test(path) || /^\/Resources\//i.test(path)) {
      return path.replace(/^\//, '');
    }
    if (/^profile\//i.test(path)) {
      return `Resources/${path}`;
    }
    return `Resources/profile/${path.replace(/^\//, '')}`;
  }

  private toPreviewUrl(path: string): string {
    if (!path) {
      return '';
    }
    if (/^https?:\/\//i.test(path) || path.startsWith('data:')) {
      return path;
    }
    return `${environment.fileUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private toUrl(path: string): string {
    return resolveCardMediaUrl(path, environment.fileUrl);
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

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const value = this.form.value;
    this.crud.add('/student-cards', {
      studentId: value.studentId,
      cardTemplateId: value.cardTemplateId || null,
      photoPath: value.photoPath || null,
      remark: value.remark || null,
      activateImmediately: !!value.activateImmediately
    }).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res?.status === 'success') {
          this.notify.notification('success', 'Success', 'Student card issued with the selected design');
          this.router.navigateByUrl('/students/student-cards');
        } else {
          this.notify.notification('error', 'Error', res?.data || res?.error || 'Issue failed');
        }
      },
      error: (err) => {
        this.saving = false;
        this.notify.notification('error', 'Error', err?.error?.data || err?.error?.error || 'Issue failed');
      }
    });
  }
}
