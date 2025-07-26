import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CoursePrerequisiteService } from '../../services/course-prerequisite.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-course-prerequisite',
  templateUrl: './course-prerequisite.component.html',
  styleUrls: ['./course-prerequisite.component.scss'],
  providers: [CoursePrerequisiteService]
})
export class CoursePrerequisiteComponent implements OnInit {
  coursePrerequisites: any[] = [];
  filteredPrerequisites: any[] = [];
  paginatedPrerequisites: any[] = [];
  searchKey: string = '';
  isLoading: boolean = false;
  
  // Pagination
  pageSize: number = 10;
  pageSizeOption: number[] = [10, 20, 50, 100];
  pageIndex: number = 1;
  total: number = 0;

  constructor(
    private coursePrerequisiteService: CoursePrerequisiteService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadPrerequisites();
  }

  loadPrerequisites(): void {
    this.isLoading = true;
    this.coursePrerequisiteService.getAllCoursePrerequisites().subscribe({
      next: (res) => {
        this.coursePrerequisites = res.data;
        this.filteredPrerequisites = [...this.coursePrerequisites];
        this.total = this.filteredPrerequisites.length;
        this.updatePaginatedData();
        this.isLoading = false;
      },
      error: (error) => {
        this.message.error('Failed to load course prerequisites');
        this.isLoading = false;
      }
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedPrerequisites = this.filteredPrerequisites.slice(startIndex, endIndex);
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.updatePaginatedData();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1;
    this.updatePaginatedData();
  }

  onSearch(): void {
    if (!this.searchKey.trim()) {
      this.filteredPrerequisites = [...this.coursePrerequisites];
    } else {
      const searchTerm = this.searchKey.toLowerCase();
      this.filteredPrerequisites = this.coursePrerequisites.filter(prerequisite => 
        (prerequisite.courseCode && prerequisite.courseCode.toLowerCase().includes(searchTerm)) ||
        (prerequisite.courseTitle && prerequisite.courseTitle.toLowerCase().includes(searchTerm)) ||
        (prerequisite.preRequisiteCourseCode && prerequisite.preRequisiteCourseCode.toLowerCase().includes(searchTerm)) ||
        (prerequisite.preRequisiteCourseTitle && prerequisite.preRequisiteCourseTitle.toLowerCase().includes(searchTerm)) ||
        (prerequisite.remark && prerequisite.remark.toLowerCase().includes(searchTerm))
      );
    }
    
    this.total = this.filteredPrerequisites.length;
    this.pageIndex = 1;
    this.updatePaginatedData();
  }

  showDeleteConfirm(id: string): void {
    this.coursePrerequisiteService.deleteCoursePrerequisite(id).subscribe({
      next: () => {
        this.message.success('Course prerequisite deleted successfully');
        this.loadPrerequisites();
      },
      error: (error) => {
        this.message.error('Failed to delete course prerequisite');
      }
    });
  }

  exportPrerequisites(): void {
    // Implement export functionality
    this.message.info('Export functionality to be implemented');
  }
}
  