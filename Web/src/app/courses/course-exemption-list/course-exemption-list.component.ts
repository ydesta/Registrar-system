import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { CourseExemptionModel } from 'src/app/Models/CourseExemptionModel';
import { CourseExemptionService } from 'src/app/services/course-exemption.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-course-exemption-list',
  templateUrl: './course-exemption-list.component.html',
  styleUrls: ['./course-exemption-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CourseExemptionListComponent implements OnInit {
  courseExemptions: CourseExemptionModel[] = [];
  loading = false;
  searchValue = '';
  filteredData: CourseExemptionModel[] = [];



  // Table configuration
  listOfData: CourseExemptionModel[] = [];
  listOfDisplayData: CourseExemptionModel[] = [];
  sortName: string | null = null;
  sortValue: string | null = null;

  constructor(
    private courseExemptionService: CourseExemptionService,
    private customNotificationService: CustomNotificationService,
    private modal: NzModalService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCourseExemptions();
  }

  loadCourseExemptions(): void {
    this.loading = true;
    this.courseExemptionService.getCourseExemptions().subscribe({
      next: (response: BaseModel<CourseExemptionModel[]>) => {
        console.log("$$$       ", response);
        if (response.status === 'success') {
          this.courseExemptions = response.data;
          this.listOfData = [...this.courseExemptions];
          this.listOfDisplayData = [...this.courseExemptions];
          this.filteredData = [...this.courseExemptions];
        } else {
          this.customNotificationService.notification('error', 'Error', 'Failed to load course exemptions');
        }
        this.loading = false;
      },
      error: (error) => {
        this.customNotificationService.notification('error', 'Error', 'Failed to load course exemptions');
        this.loading = false;
      }
    });
  }

  addCourseExemption(): void {
    this.router.navigate(['/course/course-exemption-form']);
  }

  editCourseExemption(id: number): void {
    this.router.navigate(['/course/course-exemption-form', id]);
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
      nzOnCancel: () => console.log('Cancel')
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
      error: (error) => {
        this.customNotificationService.notification('error', 'Error', 'Failed to delete course exemption');
      }
    });
  }

  // Search functionality
  search(): void {
    const filterFunc = (item: CourseExemptionModel) => {
      return (
        item.exemptedCourseName?.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1 ||
        item.exemptedCourseCode?.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1 ||
        item.exemptedCollegeName?.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1 ||
        item.studentName?.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1 ||
        item.exemptionCourse?.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1 ||
        item.grade?.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1
      );
    };

    this.filteredData = this.courseExemptions.filter(item => filterFunc(item));
    this.listOfDisplayData = this.filteredData;
  }

  reset(): void {
    this.searchValue = '';
    this.search();
  }

  // Sorting functionality
  sort(sort: { key: string; value: string } | string): void {
    if (typeof sort === 'string') {
      // Handle nz-table sort event
      this.sortName = sort;
      this.sortValue = this.sortValue === 'ascend' ? 'descend' : 'ascend';
    } else {
      // Handle object format
      this.sortName = sort.key;
      this.sortValue = sort.value;
    }
    this.search();
  }

  getStatusColor(approvedDate: Date | undefined): string {
    return approvedDate ? 'green' : 'orange';
  }

  getStatusText(approvedDate: Date | undefined): string {
    return approvedDate ? 'Approved' : 'Pending';
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
