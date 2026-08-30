import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentSectionAssignmentService } from '../../services/student-section-assignment.service';
import { ACADEMIC_TERM_STATUS, SECTION_TYPE } from '../../common/constant';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { StaticData } from '../../admission-request/model/StaticData';
import { StudentInfo, UnassignedStudentsResult } from 'src/app/Models/StudentInfo';
import { CustomNotificationService } from '../../services/custom-notification.service';
import { TermCourseOfferingService } from 'src/app/colleges/services/term-course-offering.service';

@Component({
  selector: 'app-unassigned-students',
  templateUrl: './unassigned-students.component.html',
  styleUrls: ['./unassigned-students.component.scss']
})
export class UnassignedStudentsComponent implements OnInit, OnDestroy {
  searchForm: FormGroup;
  loading: boolean = false;
  data: UnassignedStudentsResult | null = null;
  students: StudentInfo[] = [];

  // Table configuration
  listOfData: StudentInfo[] = [];
  listOfDisplayData: StudentInfo[] = [];
  searchValue = '';
  isSearchCollapsed = false;
  sortOrder: 'asc' | 'desc' | null = null;

  // Options
  listOfTermNumber: StaticData[] = [];
  listOfYears: number[] = [];


  listOfBatch: any[] = [];
  // Summary cards data
  summaryData: any[] = [];
  listOfSectionType: StaticData[] = [];
  pager: ServerPaginator;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sectionService: StudentSectionAssignmentService,
    private notificationService: CustomNotificationService,
    private courseTermOfferingService: TermCourseOfferingService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    this.createSearchForm();
  }

  ngOnInit(): void {
    this.pager.init(() => this.loadUnassignedStudents(false));
    this.getListOfAcademicTermStatus();
    this.getListOfSectionType();
    this.listOfYears = this.getYearRange(new Date().getFullYear());
    this.academicTerm.valueChanges.subscribe(res => {
      if (res && this.year.value) {
        this.getListOfBatch(res, this.year.value);
      }
    });

    this.year.valueChanges.subscribe(year => {
      if (year && this.academicTerm.value) {
        this.getListOfBatch(this.academicTerm.value, year);
      }
    });

  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  private createSearchForm(): void {
    this.searchForm = this.fb.group({
      academicTerm: [null, Validators.required],
      year: [null, Validators.required],
      batchCode: ['', Validators.required],
      sectionType: [0, Validators.required],
      sectionId: [0, []],
      courseId: [null, []],
    });
  }
  get academicTerm() {
    return this.searchForm.get("academicTerm");
  }

  get year() {
    return this.searchForm.get("year");
  }
  get sectionType() {
    return this.searchForm.get("sectionType");
  }

  get batchCode() {
    return this.searchForm.get("batchCode");
  }
  get courseId() {
    return this.searchForm.get("courseId");
  }
  get sectionId() {
    return this.searchForm.get("sectionId");
  }
  getListOfAcademicTermStatus(): void {
    ACADEMIC_TERM_STATUS.forEach((pair) => {
      const division: StaticData = {
        Id: parseInt(pair.Id.toString()),
        Description: pair.Description,
      };
      this.listOfTermNumber.push(division);
    });
  }

  getYearRange(currentYear: number): number[] {
    const startYear = 1998;
    const yearList = [];
    for (let year = startYear; year <= currentYear; year++) {
      yearList.push(year);
    }
    return yearList.reverse();
  }
  getListOfSectionType() {
    let division: StaticData = new StaticData();
    SECTION_TYPE.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfSectionType.push(division);
    });
  }

  getListOfBatch(termId: number = 0, termYear: number = 0) {
    this.courseTermOfferingService.getListOfBatchCodeByAcademicTerm(termId, termYear).subscribe(res => {
      this.listOfBatch = res;
    });
  }
  loadUnassignedStudents(resetPage = true): void {
    if (!this.searchForm.valid) {
      this.notificationService.notification('error', 'Validation Error', 'Please fill in all required fields.');
      return;
    }
    if (resetPage) {
      this.pager.pageIndex = 1;
    }
    this.loading = true;
    this.pager.loading = true;
    const { batchCode, academicTerm, year, sectionType } = this.searchForm.value;
    this.sectionService.getUnassignedStudentsPaginated(
      batchCode,
      academicTerm,
      year,
      this.pager.query({ sectionType })
    ).subscribe({
      next: (res: any) => {
        this.students = res.data || [];
        this.listOfData = [...this.students];
        this.listOfDisplayData = [...this.students];
        this.pager.applyResult(res);
        const total = this.pager.total;
        const recommended = total > 0 ? Math.ceil(total / 30) : 0;
        this.data = {
          totalUnassignedStudents: total,
          recommendedNumberOfSections: recommended,
          studentsPerSection: recommended > 0 ? Math.floor(total / recommended) : 0,
          remainingStudents: recommended > 0 ? total % recommended : 0,
          students: this.students
        };
        this.updateSummaryCards();
        this.isSearchCollapsed = true;
        this.loading = false;
      },
      error: () => {
        this.students = [];
        this.listOfDisplayData = [];
        this.pager.fail();
        this.loading = false;
        this.notificationService.notification('error', 'Error', 'Error loading unassigned students. Please try again.');
      }
    });
  }

  resetSearch(): void {
    this.searchForm.reset();
    this.searchForm.patchValue({ sectionType: 0 });
    this.students = [];
    this.listOfData = [];
    this.listOfDisplayData = [];
    this.data = null;
    this.searchValue = '';
    this.sortOrder = null;
    this.pager.pageIndex = 1;
    this.pager.total = 0;
    this.pager.searchKey = '';
    this.pager.sortColumn = '';
    this.pager.sortOrder = '';
  }

  search(): void {
    this.pager.onSearch(this.searchValue);
  }

  sortByFullName(): void {
    if (this.sortOrder === null || this.sortOrder === 'desc') {
      this.sortOrder = 'asc';
    } else {
      this.sortOrder = 'desc';
    }
    this.pager.onSort(this.sortOrder === 'desc' ? 'desc' : 'asc', 'FullName');
  }

  getSortIcon(): string {
    if (this.sortOrder === null) return 'sort';
    return this.sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending';
  }

  private applySorting(data: StudentInfo[]): StudentInfo[] {
    if (this.sortOrder === null) {
      return data;
    }

    const sorted = [...data].sort((a, b) => {
      const nameA = a.fullName.toLowerCase();
      const nameB = b.fullName.toLowerCase();

      if (this.sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    return sorted;
  }

  private updateSummaryCards(): void {
    if (!this.data) return;

    this.summaryData = [
      {
        label: 'Total Unassigned',
        value: this.data.totalUnassignedStudents,
        icon: null,
        iconType: 'team'
      },
      {
        label: 'Recommended Sections',
        value: this.data.recommendedNumberOfSections,
        icon: null,
        iconType: 'book'
      },
      {
        label: 'Students Per Section',
        value: this.data.studentsPerSection,
        icon: null,
        iconType: 'target'
      }
    ];

    if (this.data.remainingStudents > 0) {
      this.summaryData.push({
        label: 'Remaining Students',
        value: this.data.remainingStudents,
        icon: null,
        iconType: 'warning'
      });
    }
  }

  getSummaryCardSpan(): number {
    const count = this.summaryData.length;
    if (count === 0) return 6;
    return Math.floor(24 / count);
  }

  getSectionTypeLabel(): string {
    const sectionType = this.searchForm.get('sectionType')?.value;
    return sectionType === 0 ? 'Regular' : 'Lab';
  }

  exportToCSV(): void {
    if (!this.students || this.students.length === 0) {
      this.notificationService.notification('warning', 'Warning', 'No data to export');
      return;
    }

    const headers = ['Student Code', 'Full Name', 'Batch Code', 'Unassigned Courses'];
    const rows = this.students.map(student => [
      student.studentCode,
      student.fullName,
      student.batchCode,
      student.unassignedCourseCount.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const batchCode = this.searchForm.get('batchCode')?.value || 'all';
    const sectionType = this.getSectionTypeLabel();

    link.setAttribute('href', url);
    link.setAttribute('download', `unassigned-students-${batchCode}-${sectionType}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.notification('success', 'Success', 'Data exported successfully');
  }

  // Modal state
  isModalVisible = false;
  selectedStudent: StudentInfo | null = null;

  navigateToNewComponent(student: StudentInfo): void {

    this.selectedStudent = student;
    this.isModalVisible = true;
  }

  onModalClose(): void {
    this.isModalVisible = false;
    this.selectedStudent = null;
    // Reload the unassigned students list
    this.loadUnassignedStudents();
  }

  onModalSuccess(): void {
    this.isModalVisible = false;
    this.selectedStudent = null;
    // Reload the unassigned students list
    this.loadUnassignedStudents();
  }
}

