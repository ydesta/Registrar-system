import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StudentCoursesTaken } from 'src/app/students/models/student-profile-view-model.model';
import { StudentService } from 'src/app/students/services/student.service';



@Component({
  selector: 'app-add-drop-course-list',
  templateUrl: './add-drop-course-list.component.html',
  styleUrls: ['./add-drop-course-list.component.scss']
})
export class AddDropCourseListComponent implements OnInit {
  addDropList: StudentCoursesTaken[] = [];
  applicantId: string = '';
  loading = false;
  constructor(
    private courseApprovalService: StudentService,
    private message: NzMessageService
  ) {
    this.applicantId = localStorage.getItem('userId');
  }
  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.getListOfAllAddDropCourse();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'error';
      default:
        return 'warning';
    }
  }

  getListOfAllAddDropCourse(): void {
    this.courseApprovalService.getListOfAllAddDropCourse(this.applicantId).subscribe(
      (response) => {
        this.addDropList = response;
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        this.message.error('Failed to load add/drop course list');
      }
    );
  }
}
