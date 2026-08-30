import { Component, OnDestroy, OnInit } from '@angular/core';
import { CourseModel } from 'src/app/Models/CourseModel';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { CrudService } from 'src/app/services/crud.service';

@Component({
  selector: 'app-course-report',
  templateUrl: './course-report.component.html',
  styleUrls: ['./course-report.component.scss'],
})
export class CourseReportComponent implements OnInit, OnDestroy {
  courses: CourseModel[] = [];
  pager: ServerPaginator;

  constructor(
    private _crudService: CrudService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.pager.init(() => this.fetchProgram());
    this.fetchProgram();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  fetchProgram() {
    this.pager.loading = true;
    this._crudService
      .getPaginated(`/Courses`, this.pager.query())
      .subscribe({
        next: (res: any) => {
          this.courses = res.data || [];
          this.pager.applyResult(res);
        },
        error: () => {
          this.courses = [];
          this.pager.fail();
        }
      });
  }
}
