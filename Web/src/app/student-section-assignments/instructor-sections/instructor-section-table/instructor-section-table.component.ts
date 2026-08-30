import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { InstructorSectionModel, InstructorSectionAssignmentViewModel } from '../../../Models/InstructorSectionModel';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { TermCourseOfferingService } from 'src/app/colleges/services/term-course-offering.service';
import { Router } from '@angular/router';
import { InstructorSectionService } from 'src/app/services/instructor-section.service';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';

@Component({
  selector: 'app-instructor-section-table',
  templateUrl: './instructor-section-table.component.html',
  styleUrls: ['./instructor-section-table.component.scss']
})
export class ManageInstructorTableComponent implements OnInit, OnDestroy {
  @Input() loading = false;

  @Output() editInstructorSection = new EventEmitter<InstructorSectionAssignmentViewModel>();
  @Output() deleteInstructorSection = new EventEmitter<number>();
  @Output() dataRefreshed = new EventEmitter<void>();

  searchForm!: FormGroup;
  filteredInstructorSections: any[] = [];
  private destroy$ = new Subject<void>();

  // Search collapse state
  isSearchCollapsed = false;
  isLoadingBatches = false;
  academicTermList: StaticData[] = [];

  yearList: number[] = [];
  batchList: any[] = [];
  searchValue = '';
  hasSearched = false;
  pager: ServerPaginator;

  constructor(private fb: FormBuilder,
    private courseTermOfferingService: TermCourseOfferingService,
    private router: Router,
    private instructorSectionService: InstructorSectionService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    this.initializeSearchForm();
    const currentYear = new Date().getFullYear();
    this.yearList = this.getYearRange(currentYear);
  }

  ngOnInit(): void {
    this.pager.init(() => this.applyFilters(false));
    this.filteredInstructorSections = [];
    this.getListOfAcademicTermStatus();
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

  get academicTerm() {
    return this.searchForm.get('academicTerm')!;
  }
  get year() {
    return this.searchForm.get('year')!;
  }
  get batchCode() {
    return this.searchForm.get('batchCode')!;
  }
  ngOnDestroy(): void {
    this.pager.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  getYearRange(currentYear: number): number[] {
    const startYear = currentYear - 4;
    const yearList = [];
    for (let year = startYear; year <= currentYear; year++) {
      yearList.push(year);
    }
    return yearList.reverse();
  }

  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.academicTermList.push(division);
    });
  }

  getListOfBatch(termId: number = 0, termYear: number = 0) {
    this.courseTermOfferingService.getListOfBatchCodeByAcademicTerm(termId, termYear).subscribe(res => {
      this.batchList = res;
    });
  }



  private initializeSearchForm(): void {
    this.searchForm = this.fb.group({
      batchId: [null, Validators.required],
      academicTerm: [null, Validators.required],
      year: [null, Validators.required]
    });
  }

  private applyFilters(resetPage = true): void {
    const { batchId, academicTerm, year } = this.searchForm.value;
    if (!academicTerm || !year || !batchId) {
      this.filteredInstructorSections = [];
      this.pager.total = 0;
      return;
    }
    if (resetPage) {
      this.pager.pageIndex = 1;
    }
    this.hasSearched = true;
    this.loading = true;
    this.pager.loading = true;
    this.instructorSectionService
      .getInstructorSectionsByCriteriaPaginated(academicTerm, year, batchId, this.pager.query())
      .subscribe({
        next: (res: any) => {
          this.filteredInstructorSections = res.data || [];
          this.pager.applyResult(res);
          this.loading = false;
        },
        error: () => {
          this.filteredInstructorSections = [];
          this.pager.fail();
          this.loading = false;
        }
      });
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.filteredInstructorSections = [];
    this.searchValue = '';
    this.hasSearched = false;
    this.pager.pageIndex = 1;
    this.pager.total = 0;
    this.pager.searchKey = '';
  }

  applySearch(): void {
    if (this.searchForm.valid) {
      this.applyFilters();
      this.isSearchCollapsed = true;
    }
  }

  search(): void {
    this.pager.onSearch(this.searchValue);
  }

  toggleSearchCollapse(): void {
    this.isSearchCollapsed = !this.isSearchCollapsed;
  }


  getTermColor(term: number): string {
    switch (term) {
      case 1: return 'blue';
      case 2: return 'green';
      case 3: return 'orange';
      default: return 'default';
    }
  }
  navigateToForm(editData?: InstructorSectionAssignmentViewModel): void {
    if (editData) {
      this.router.navigate(['/student-section/instructor-section-form', editData.id]);
    } else {
      this.router.navigate(['/student-section/instructor-section-form']);
    }
  }
  getTermDescription(termId: number): string {
    const term = this.academicTermList.find(t => t.Id === termId);
    return term ? term.Description : 'Unknown';
  }

  onEdit(item: InstructorSectionAssignmentViewModel): void {
    this.editInstructorSection.emit(item);
  }

  onDelete(id: number): void {
    this.deleteInstructorSection.emit(id);
    // After deletion, refresh the data by clearing the current results
    this.filteredInstructorSections = [];
    this.dataRefreshed.emit();
  }
}
