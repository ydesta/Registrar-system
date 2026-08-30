import { SearchQueryParams } from './../SearchParam/search-query-params';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CrudService } from 'src/app/services/crud.service';
import { ReportService } from 'src/app/reports/services/report.service';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';

@Component({
  selector: 'app-registered-student',
  templateUrl: './registered-student.component.html',
  styleUrls: ['./registered-student.component.scss'],
})
export class RegisteredStudentComponent implements OnInit, OnDestroy {
  academicTerms: any;
  courses: any;
  gradeQueryForm: FormGroup;
  registeredStudents: any[] | null = null;
  radioValues = ['Accepted', 'Rejected'];
  searchKey = '';
  pager: ServerPaginator;
  loading = false;

  constructor(
    private _crudService: CrudService,
    private _reportService: ReportService,
    private _fb: FormBuilder,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    this.gradeQueryForm = this._fb.group({
      termCode: ['', Validators.required],
      courseCode: ['', [Validators.required]],
      radio: [{ value: 'Accepted', disabled: false }, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.pager.init(() => this.acadamicTermFormSubmit(false));
    this._crudService.getList('/Courses').subscribe((res: any) => {
      this.courses = res.data;
    });
    this._crudService.getList('/academicTerms').subscribe((res: any) => {
      this.academicTerms = res.data;
    });
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  getRegisteredStud(): SearchQueryParams {
    const formModel = this.gradeQueryForm.getRawValue();
    const params = new SearchQueryParams();
    params.AcademicTerm = formModel.termCode;
    params.Course = formModel.courseCode;
    params.Status = formModel.radio;
    return params;
  }

  acadamicTermFormSubmit(resetPage = true) {
    if (!this.gradeQueryForm.valid) {
      return;
    }
    if (resetPage) {
      this.pager.pageIndex = 1;
    }
    this.loading = true;
    this.pager.loading = true;
    this._reportService.getRegisteredStudentsPaginated(this.getRegisteredStud(), this.pager.query()).subscribe({
      next: (res: any) => {
        this.registeredStudents = res.data || [];
        this.pager.applyResult(res);
        this.loading = false;
      },
      error: () => {
        this.registeredStudents = [];
        this.pager.fail();
        this.loading = false;
      }
    });
  }

  search(): void {
    this.pager.onSearch(this.searchKey);
  }

  onPageIndexChange(page: number): void {
    this.pager.onPageIndexChange(page);
  }

  onPageSizeChange(size: number): void {
    this.pager.onPageSizeChange(size);
  }
}
