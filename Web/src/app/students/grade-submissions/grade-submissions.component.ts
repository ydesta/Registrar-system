import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SECTION_TYPE } from 'src/app/common/constant';
import { BatchTermService } from 'src/app/colleges/services/batch-term.service';
import { InstructorSectionAssignmentViewModel } from 'src/app/Models/InstructorSectionModel';
import { AuthService } from 'src/app/services/auth.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { InstructorSectionService } from 'src/app/services/instructor-section.service';
import { StaffService } from 'src/app/services/staff.service';
import { environment } from 'src/environments/environment';
import {
  AssignmentCourseOption,
  GradeSubmissionLine,
  GradeSubmissionListItem
} from '../models/grade-submission.model';
import { StudentGradeService } from '../services/student-grade.service';

@Component({
  selector: 'app-grade-submissions',
  templateUrl: './grade-submissions.component.html',
  styleUrls: ['./grade-submissions.component.scss']
})
export class GradeSubmissionsComponent implements OnInit {
  isAdmin = false;
  loading = false;
  detailLoading = false;
  submissions: GradeSubmissionListItem[] = [];
  filteredSubmissions: GradeSubmissionListItem[] = [];

  filterBatch = '';
  filterInstructor = '';
  filterCourse = '';
  filterCourseId = '';
  filterTerm = '';

  selected: GradeSubmissionListItem | null = null;
  lines: GradeSubmissionLine[] = [];

  private staffId = '';
  private instructorDisplayName = '';
  private assignedCourseOptions: AssignmentCourseOption[] = [];
  private assignedBatchCodes = new Set<string>();
  private assignedCourseIds = new Set<string>();

  constructor(
    private studentGradeService: StudentGradeService,
    private notify: CustomNotificationService,
    private authService: AuthService,
    private staffService: StaffService,
    private instructorSectionService: InstructorSectionService,
    private batchTermService: BatchTermService
  ) {
    this.isAdmin =
      this.authService.hasRole('Administrator') ||
      this.authService.hasRole('Admin') ||
      this.authService.hasRole('Super Admin');
  }

  ngOnInit(): void {
    if (this.isAdmin) {
      this.loadSubmissions();
      return;
    }

    const userId = this.authService.getCurrentUser()?.id || localStorage.getItem('userId') || '';
    if (!userId) {
      this.notify.notification('error', 'Error', 'Could not resolve the signed-in instructor.');
      return;
    }

    this.staffService.getStaffByUserId(userId).subscribe({
      next: (res: any) => {
        const staff = res?.data;
        if (!staff?.id) {
          this.notify.notification('error', 'Error', 'Staff profile was not found for this instructor.');
          return;
        }

        this.staffId = String(staff.id);
        this.instructorDisplayName =
          `${staff.firstName ?? ''} ${staff.middleName ?? ''} ${staff.lastName ?? ''}`.trim() ||
          staff.fullName ||
          '';

        this.loadInstructorAssignmentsThenSubmissions();
      },
      error: () => {
        this.notify.notification('error', 'Error', 'Failed to load instructor staff profile.');
      }
    });
  }

  get batchOptions(): string[] {
    if (!this.isAdmin && this.assignedBatchCodes.size > 0) {
      return [...this.assignedBatchCodes].sort();
    }
    return [...new Set(this.submissions.map(s => s.batchCode).filter(Boolean))].sort();
  }

  get instructorOptions(): string[] {
    return [...new Set(this.submissions.map(s => s.instructor).filter(Boolean))].sort();
  }

  get courseOptions(): string[] {
    if (!this.isAdmin) {
      return this.assignedCourseOptions.map(c => c.label).sort();
    }
    return [...new Set(this.submissions.map(s => s.course).filter(Boolean))].sort();
  }

  get termOptions(): string[] {
    return [...new Set(this.submissions.map(s => s.academicTerm).filter(Boolean))].sort();
  }

  get subtitleText(): string {
    if (this.isAdmin) {
      return 'View uploaded Excel files and grade reports by course, batch, term, year, and instructor.';
    }
    const name = this.instructorDisplayName ? ` for ${this.instructorDisplayName}` : '';
    return `View your uploaded Excel files and grade reports${name}. Courses are limited to your assignments.`;
  }

  loadSubmissions(): void {
    this.loading = true;
    this.studentGradeService.getGradeSubmissions().subscribe({
      next: (res) => {
        this.loading = false;
        let rows = Array.isArray(res) ? res : [];

        if (!this.isAdmin && this.assignedCourseIds.size > 0) {
          rows = rows.filter(s => this.assignedCourseIds.has(String(s.courseId || '').toLowerCase()));
        }

        this.submissions = rows;
        this.applyFilters();
      },
      error: (err) => {
        this.loading = false;
        this.notify.notification(
          'error',
          'Error',
          err?.error?.message || err?.message || 'Failed to load grade submissions.'
        );
      }
    });
  }

  applyFilters(): void {
    this.filteredSubmissions = this.submissions.filter(s => {
      if (this.filterBatch && s.batchCode !== this.filterBatch) return false;
      if (this.isAdmin && this.filterInstructor && s.instructor !== this.filterInstructor) return false;
      if (this.isAdmin && this.filterCourse && s.course !== this.filterCourse) return false;
      if (!this.isAdmin && this.filterCourseId && String(s.courseId || '').toLowerCase() !== this.filterCourseId.toLowerCase()) return false;
      if (this.filterTerm && s.academicTerm !== this.filterTerm) return false;
      return true;
    });
  }

  onCourseFilterChange(value: string): void {
    if (this.isAdmin) {
      this.filterCourse = value || '';
      this.filterCourseId = '';
    } else {
      const match = this.assignedCourseOptions.find(c => c.label === value);
      this.filterCourse = value || '';
      this.filterCourseId = match?.courseId || '';
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterBatch = '';
    this.filterInstructor = '';
    this.filterCourse = '';
    this.filterCourseId = '';
    this.filterTerm = '';
    this.applyFilters();
  }

  viewSubmission(item: GradeSubmissionListItem): void {
    this.selected = item;
    this.detailLoading = true;
    this.lines = [];

    this.studentGradeService.getGradeSubmissionDetail({
      courseId: item.courseId,
      academicTermId: item.academicTermId,
      staffId: item.staffId,
      batchCode: item.batchCode || ''
    }).subscribe({
      next: (res) => {
        this.detailLoading = false;
        this.selected = res?.submission || item;
        this.lines = res?.lines || [];
      },
      error: (err) => {
        this.detailLoading = false;
        this.notify.notification(
          'error',
          'Error',
          err?.error?.message || err?.message || 'Failed to load submission detail.'
        );
      }
    });
  }

  downloadFile(item: GradeSubmissionListItem | null): void {
    if (!item?.fileUrl && !item?.fileName) {
      this.notify.notification('warning', 'No file', 'No uploaded Excel file is linked to this submission.');
      return;
    }

    const path = item.fileUrl || `/Resources/studentgrade/${item.fileName}`;
    const url = path.startsWith('http') ? path : `${environment.fileUrl}${path}`;
    window.open(url, '_blank');
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }

  private loadInstructorAssignmentsThenSubmissions(): void {
    this.batchTermService.getNextAcademicTerm().subscribe({
      next: (res: any) => {
        const termId = Number(res?.termId ?? res?.TermId);
        const year = Number(res?.year ?? res?.Year);
        if (!termId || !year) {
          this.loadSubmissions();
          return;
        }
        this.fetchAssignments(termId, year);
      },
      error: () => {
        this.loadSubmissions();
      }
    });
  }

  private fetchAssignments(termId: number, year: number): void {
    const sectionTypes = SECTION_TYPE?.length ? SECTION_TYPE : [{ Id: 0, Description: 'Class' }];
    const requests = sectionTypes.map((st: any) =>
      this.instructorSectionService
        .getInstructorSectionAssignmentsByStaff(this.staffId, termId, year, Number(st.Id))
        .pipe(catchError(() => of({ data: [] })))
    );

    forkJoin(requests).subscribe({
      next: (results: any[]) => {
        const courseMap = new Map<string, string>();
        const batches = new Set<string>();

        results.forEach(res => {
          const rows = (res?.data || []) as InstructorSectionAssignmentViewModel[];
          for (const row of rows) {
            if (!row?.courseId) continue;
            const label = row.course || row.courseId;
            courseMap.set(String(row.courseId).toLowerCase(), label);
            if (row.batchCode) {
              batches.add(row.batchCode);
            }
          }
        });

        this.assignedCourseOptions = [...courseMap.entries()].map(([courseId, label]) => ({
          courseId,
          label
        }));
        this.assignedCourseIds = new Set(
          [...courseMap.keys()].map(id => id.toLowerCase())
        );
        this.assignedBatchCodes = batches;
        this.loadSubmissions();
      },
      error: () => {
        this.loadSubmissions();
      }
    });
  }
}
