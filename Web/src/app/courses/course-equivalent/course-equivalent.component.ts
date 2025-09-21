import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { CourseEquivalencyViewModel, CourseEquivalentModel } from 'src/app/Models/CourseEquivalentModel';
import { CourseModel } from 'src/app/Models/CourseModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-course-equivalent',
  templateUrl: './course-equivalent.component.html',
  styleUrls: ['./course-equivalent.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CourseEquivalentComponent implements OnInit {

  courseEquivalents: CourseEquivalencyViewModel[] = [];
  loading = false;
  searchValue = '';
  filteredData: CourseEquivalencyViewModel[] = [];

  // Table configuration
  listOfData: CourseEquivalencyViewModel[] = [];
  listOfDisplayData: CourseEquivalencyViewModel[] = [];
  sortName: string | null = null;
  sortValue: string | null = null;
  reqId = '';
  checked = false;

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService,
    private router: Router
  ) { }
  
  ngOnInit(): void {
    this.loadCourseEquivalents();
  }

  loadCourseEquivalents(): void {
    this.loading = true;
    this._crudService.getList('/CourseEquivalents').subscribe({
      next: (res: BaseModel<CourseEquivalencyViewModel[]>) => {
        if (res.status === 'success') {
          this.courseEquivalents = res.data;
          this.listOfData = [...this.courseEquivalents];
          this.listOfDisplayData = [...this.courseEquivalents];
          this.filteredData = [...this.courseEquivalents];
        } else {
          this._customNotificationService.notification('error', 'Error', 'Failed to load course equivalents');
        }
        this.loading = false;
      },
      error: (error) => {
        this._customNotificationService.notification('error', 'Error', 'Failed to load course equivalents');
        this.loading = false;
      }
    });
  }

  // Search functionality
  search(): void {
    const filterFunc = (item: CourseEquivalencyViewModel) => {
      return (
        item.courseCode?.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1 ||
        item.courseTitle?.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1 ||
        item.equivalentCourseCode?.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1 ||
        item.equivalentCourseTitle?.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1 ||
        item.equivalentCourseId?.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1 ||
        item.remark?.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1
      );
    };

    this.filteredData = this.courseEquivalents.filter(item => filterFunc(item));
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
      nzCancelText: 'No',
      nzOnCancel: () => console.log('Cancel')
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
      error: (error) => {
        this._customNotificationService.notification('error', 'Error', 'Failed to delete course equivalent');
      }
    });
  }
}
  