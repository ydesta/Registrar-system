import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { CourseExemptionModel } from 'src/app/Models/CourseExemptionModel';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { CourseExemptionService } from 'src/app/services/course-exemption.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-course-exemption-list',
  templateUrl: './course-exemption-list.component.html',
  styleUrls: ['./course-exemption-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CourseExemptionListComponent implements OnInit, OnDestroy {
  listOfDisplayData: CourseExemptionModel[] = [];
  pager: ServerPaginator;

  constructor(
    private courseExemptionService: CourseExemptionService,
    private customNotificationService: CustomNotificationService,
    private modal: NzModalService,
    private router: Router,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.pager.init(() => this.loadCourseExemptions());
    this.loadCourseExemptions();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  loadCourseExemptions(): void {
    this.pager.loading = true;
    this.courseExemptionService.getCourseExemptionsPaginated(this.pager.query()).subscribe({
      next: (response: any) => {
        this.listOfDisplayData = response.data || [];
        this.pager.applyResult(response);
      },
      error: () => {
        this.listOfDisplayData = [];
        this.pager.fail();
        this.customNotificationService.notification('error', 'Error', 'Failed to load course exemptions');
      }
    });
  }

  addCourseExemption(): void {
    this.router.navigate(['/course/course-exemption-form']);
  }

  showDeleteConfirm(id: number): void {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this course exemption?',
      nzContent: 'This action cannot be undone.',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.deleteCourseExemption(id);
      },
      nzCancelText: 'No',
      nzOnCancel: () => {}
    });
  }

  deleteCourseExemption(id: number): void {
    this.courseExemptionService.deleteCourseExemption(id).subscribe({
      next: (response: BaseModel<any>) => {
        if (response.status === 'success') {
          this.customNotificationService.notification('success', 'Success', response.data);
          this.loadCourseExemptions();
        } else {
          this.customNotificationService.notification('error', 'Error', response.data);
        }
      },
      error: () => {
        this.customNotificationService.notification('error', 'Error', 'Failed to delete course exemption');
      }
    });
  }

  getGradeColor(gradeLetter: string | undefined): string {
    if (!gradeLetter) return 'default';

    const grade = gradeLetter.toUpperCase();
    if (grade === 'A') return 'green';
    if (grade === 'B') return 'blue';
    if (grade === 'C') return 'orange';
    if (grade === 'D') return 'red';
    return 'default';
  }
}
