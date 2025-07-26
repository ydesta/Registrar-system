import { Component, OnInit } from '@angular/core';
import { CourseModel } from 'src/app/Models/CourseModel';
import { CrudService } from 'src/app/services/crud.service';

@Component({
  selector: 'app-course-report',
  templateUrl: './course-report.component.html',
  styleUrls: ['./course-report.component.scss'],
})
export class CourseReportComponent implements OnInit {
  courses: CourseModel[] = [];
  pageindex = 1;
  totalRecord = 0;
  pageSize = 5;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  sortOrder = '';
  sortColumn = '';
  searchKey = '';
  constructor(private _crudService: CrudService) {}
  ngOnInit(): void {
    this.fetchProgram();
  }
  fetchProgram() {
    this._crudService
      .getList(
        '/Courses/paginated?searchKey=' +
          this.searchKey +
          '&pageindex=' +
          (this.pageindex - 1) +
          '&pageSize=' +
          this.pageSize +
          '&sortColumn=' +
          this.sortColumn +
          '&sortOrder=' +
          this.sortOrder
      )
      .subscribe((res: any) => {
        this.courses = res.data;
        this.totalRecord = this.courses.length;
        this.pageSize = res.itemPerPage;
        this.pageindex = res.currentPage + 1;
        this.totalRecord = res.totalRowCount;
      });
  }
  paginatedIndexEvent(event: any) {
    this.pageindex = event;
    this.fetchProgram();
  }
  paginatedSizeEvent(event: any) {
    this.pageSize = event;
    this.fetchProgram();
  }
}
