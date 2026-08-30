import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CourseEquivalencyViewModel } from 'src/app/Models/CourseEquivalentModel';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-course-equivalent',
  templateUrl: './course-equivalent.component.html',
  styleUrls: ['./course-equivalent.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CourseEquivalentComponent implements OnInit, OnDestroy {
  courseEquivalents: CourseEquivalencyViewModel[] = [];
  pager: ServerPaginator;
  reqId = '';

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.pager.init(() => this.loadCourseEquivalents());
    this.loadCourseEquivalents();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  loadCourseEquivalents(): void {
    this.pager.loading = true;
    this._crudService.getPaginated(`/CourseEquivalents`, this.pager.query()).subscribe({
      next: (res: any) => {
        this.courseEquivalents = res.data || [];
        this.pager.applyResult(res);
      },
      error: () => {
        this.courseEquivalents = [];
        this.pager.fail();
        this._customNotificationService.notification('error', 'Error', 'Failed to load course equivalents');
      }
    });
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this course equivalent?',
      nzContent: 'This action cannot be undone.',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.deleteCourseEquivalent(id);
      },
      nzCancelText: 'No'
    });
  }

  deleteCourseEquivalent(id: any): void {
    this._crudService.delete('/CourseEquivalents', id).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this._customNotificationService.notification('success', 'Success', res.data);
          this.loadCourseEquivalents();
        } else {
          this._customNotificationService.notification('error', 'Error', res.data);
        }
      },
      error: () => {
        this._customNotificationService.notification('error', 'Error', 'Failed to delete course equivalent');
      }
    });
  }
}
