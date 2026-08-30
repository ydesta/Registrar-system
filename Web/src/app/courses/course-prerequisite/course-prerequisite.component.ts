import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { CrudService } from 'src/app/services/crud.service';
import { CoursePrerequisiteService } from '../../services/course-prerequisite.service';

@Component({
  selector: 'app-course-prerequisite',
  templateUrl: './course-prerequisite.component.html',
  styleUrls: ['./course-prerequisite.component.scss'],
  providers: [CoursePrerequisiteService]
})
export class CoursePrerequisiteComponent implements OnInit, OnDestroy {
  coursePrerequisites: any[] = [];
  pager: ServerPaginator;

  constructor(
    private coursePrerequisiteService: CoursePrerequisiteService,
    private _crudService: CrudService,
    private message: NzMessageService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.pager.init(() => this.loadPrerequisites());
    this.loadPrerequisites();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  loadPrerequisites(): void {
    this.pager.loading = true;
    this._crudService.getPaginated(`/CoursePrerequisites`, this.pager.query()).subscribe({
      next: (res: any) => {
        this.coursePrerequisites = res.data || [];
        this.pager.applyResult(res);
      },
      error: () => {
        this.coursePrerequisites = [];
        this.pager.fail();
        this.message.error('Failed to load course prerequisites');
      }
    });
  }

  showDeleteConfirm(id: string): void {
    this.coursePrerequisiteService.deleteCoursePrerequisite(id).subscribe({
      next: () => {
        this.message.success('Course prerequisite deleted successfully');
        this.loadPrerequisites();
      },
      error: () => {
        this.message.error('Failed to delete course prerequisite');
      }
    });
  }

  exportPrerequisites(): void {
    this.message.info('Export functionality to be implemented');
  }
}
