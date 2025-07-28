import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NzModalService } from "ng-zorro-antd/modal";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { StudentService } from "./services/student.service";
import { StudentProfileViewModel } from "./models/student-profile-view-model.model";




@Component({
  selector: "app-students",
  templateUrl: "./students.component.html",
  styleUrls: ["./students.component.scss"]
})
export class StudentsComponent implements OnInit {
  students: StudentProfileViewModel[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 20;
  totalRowCount = 0;
  totalPageCount = 0;
  hasPrev = false;
  hasNext = false;
  searchForm: FormGroup;
  studentCode = "";
  batchCode = "";
  sortColumn = "studentid";
  sortOrder = "asc";
  academicTerms: any;
  courses: any;
  studentId = "";
  Math = Math;

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _studentService: StudentService,
    private modal: NzModalService,
    private _fb: FormBuilder,
    private _route: Router
  ) {
    this.searchForm = this._fb.group({
      studentCode: [""],
      batchCode: [""],
      sortColumn: ["studentid"],
      sortOrder: ["asc"]
    });
  }

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(pageIndex: number = 0) {
    this.loading = true;
    
    this._studentService
      .getStudentsPaginated(
        this.studentCode,
        this.batchCode,
        pageIndex,
        this.pageSize,
        this.sortColumn,
        this.sortOrder
      )
      .subscribe({
        next: (res: any) => {
          this.students = res.data;
          this.currentPage = res.currentPage;
          this.totalRowCount = res.totalRowCount;
          this.totalPageCount = res.totalPageCount;
          this.hasPrev = res.hasPrev;
          this.hasNext = res.hasNext;
          this.loading = false;
        },
        error: (error) => {
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to load students"
          );
          this.loading = false;
        }
      });
  }

  onSearch() {
    this.studentCode = this.searchForm.get('studentCode')?.value || "";
    this.batchCode = this.searchForm.get('batchCode')?.value || "";
    this.currentPage = 0; 
    this.loadStudents();
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortOrder = 'asc';
    }
    
    this.searchForm.patchValue({
      sortColumn: this.sortColumn,
      sortOrder: this.sortOrder
    });
    
    this.loadStudents();
  }

  onPageChange(pageIndex: number) {
    this.currentPage = pageIndex;
    this.loadStudents(pageIndex);
  }

  onPageSizeChange(newPageSize: number) {
    this.pageSize = newPageSize;
    this.currentPage = 0; 
    this.loadStudents();
  }

  clearSearch() {
    this.searchForm.reset({
      studentCode: "",
      batchCode: "",
      sortColumn: "studentid",
      sortOrder: "asc"
    });
    this.studentCode = "";
    this.batchCode = "";
    this.sortColumn = "studentid";
    this.sortOrder = "asc";
    this.currentPage = 0;
    this.loadStudents();
  }

  showDeleteConfirm(student: StudentProfileViewModel): void {
    const studentName = student.fullName || 'Student';
    const studentInfo = student.studentCode ? `(${student.studentCode})` : '';
    const displayName = studentName ? `${studentName} ${studentInfo}` : `Student ${studentInfo}`;
    
    this.modal.confirm({
      nzTitle: `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span nz-icon nzType="exclamation-circle" nzTheme="outline" style="color: #faad14; font-size: 20px;"></span>
          <span style="font-weight: 600; color: #262626;">Confirm Student Inactivation</span>
        </div>
      `,
      nzContent: `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 24px; margin: 16px 0; border: none; box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3); position: relative; overflow: hidden;">
          <!-- Decorative background elements -->
          <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -30px; left: -30px; width: 80px; height: 80px; background: rgba(255, 255, 255, 0.08); border-radius: 50%;"></div>
          
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; position: relative; z-index: 2;">
            <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #ff6b6b, #ee5a24); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px; box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4); border: 3px solid rgba(255, 255, 255, 0.3);">
              ${studentName.charAt(0).toUpperCase()}
            </div>
            <div style="flex: 1;">
              <h3 style="margin: 0 0 6px 0; color: white; font-weight: 700; font-size: 20px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">${displayName}</h3>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span nz-icon nzType="user" nzTheme="outline" style="color: rgba(255, 255, 255, 0.8); font-size: 14px;"></span>
                <span style="color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">Student Profile</span>
              </div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 8px 12px; backdrop-filter: blur(10px);">
              <span nz-icon nzType="idcard" nzTheme="outline" style="color: white; font-size: 18px;"></span>
            </div>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.3); backdrop-filter: blur(10px); position: relative; z-index: 2;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              ${student.batch ? `
                <div style="background: linear-gradient(135deg, #74b9ff, #0984e3); border-radius: 10px; padding: 16px; position: relative; overflow: hidden; box-shadow: 0 4px 12px rgba(116, 185, 255, 0.3);">
                  <div style="position: absolute; top: -10px; right: -10px; width: 40px; height: 40px; background: rgba(255, 255, 255, 0.2); border-radius: 50%;"></div>
                  <div style="display: flex; align-items: center; gap: 12px; position: relative; z-index: 2;">
                    <div style="width: 40px; height: 40px; background: rgba(255, 255, 255, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                      <span nz-icon nzType="team" nzTheme="outline" style="color: white; font-size: 18px;"></span>
                    </div>
                    <div>
                      <div style="font-size: 11px; color: rgba(255, 255, 255, 0.8); margin-bottom: 4px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Batch Code</div>
                      <div style="font-weight: 700; color: white; font-size: 16px; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">${student.batch}</div>
                    </div>
                  </div>
                </div>
              ` : ''}
              ${student.entryYear ? `
                <div style="background: linear-gradient(135deg, #00b894, #00a085); border-radius: 10px; padding: 16px; position: relative; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 184, 148, 0.3);">
                  <div style="position: absolute; top: -10px; right: -10px; width: 40px; height: 40px; background: rgba(255, 255, 255, 0.2); border-radius: 50%;"></div>
                  <div style="display: flex; align-items: center; gap: 12px; position: relative; z-index: 2;">
                    <div style="width: 40px; height: 40px; background: rgba(255, 255, 255, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                      <span nz-icon nzType="calendar" nzTheme="outline" style="color: white; font-size: 18px;"></span>
                    </div>
                    <div>
                      <div style="font-size: 11px; color: rgba(255, 255, 255, 0.8); margin-bottom: 4px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Entry Year</div>
                      <div style="font-weight: 700; color: white; font-size: 16px; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">${student.entryYear}</div>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <!-- Additional student info indicators -->
            <div style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
              <div style="background: linear-gradient(135deg, #fdcb6e, #e17055); border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(253, 203, 110, 0.3);">
                <span nz-icon nzType="safety-certificate" nzTheme="outline" style="color: white; font-size: 14px;"></span>
                <span style="color: white; font-size: 12px; font-weight: 600;">Active Student</span>
              </div>
              <div style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(108, 92, 231, 0.3);">
                <span nz-icon nzType="book" nzTheme="outline" style="color: white; font-size: 14px;"></span>
                <span style="color: white; font-size: 12px; font-weight: 600;">Enrolled</span>
              </div>
              <div style="background: linear-gradient(135deg, #fd79a8, #e84393); border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(253, 121, 168, 0.3);">
                <span nz-icon nzType="check-circle" nzTheme="outline" style="color: white; font-size: 14px;"></span>
                <span style="color: white; font-size: 12px; font-weight: 600;">Verified</span>
              </div>
            </div>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #ff7675, #d63031); border: 2px solid #ff6b6b; border-radius: 12px; padding: 20px; margin-top: 20px; position: relative; overflow: hidden; box-shadow: 0 6px 20px rgba(255, 118, 117, 0.3);">
          <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; position: relative; z-index: 2;">
            <div style="width: 50px; height: 50px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
              <span nz-icon nzType="warning" nzTheme="outline" style="color: white; font-size: 24px;"></span>
            </div>
            <div>
              <h4 style="margin: 0 0 4px 0; color: white; font-weight: 700; font-size: 18px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">⚠️ Critical Action</h4>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; line-height: 1.6; font-weight: 500;">
                This action will <strong>permanently mark</strong> the student as inactive. The student will lose access to course registration, system login, and all academic activities.
              </p>
            </div>
          </div>
        </div>
      `,
      nzOkText: "Yes, Mark as Inactive",
      nzOkType: "primary",
      nzOkDanger: true,
      nzCancelText: "Cancel",
      nzWidth: 500,
      nzClassName: "custom-confirm-modal",
      nzOnOk: () => {
        this._studentService
          .deleteStudent(student.id)
          .subscribe((res: any) => {
            if (res.status == "success") {
              this._customNotificationService.notification(
                "success",
                "Success",
                res.data
              );
              this.loadStudents(); 
            }
            if (res.status == "error") {
              this._customNotificationService.notification(
                "error",
                "Error",
                res.data
              );
            }
          });
      },
      nzOnCancel: () => console.log("Cancel")
    });
  }

  viewStudentProfile(studentId: string) {
    this._route.navigate(['/students/profile', studentId]);
  }

  editStudent(studentId: string) {
    this._route.navigate(['/students/edit', studentId]);
  }

  inactiveStudent(student: StudentProfileViewModel) {
    this.showDeleteConfirm(student);
  }



  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'sort';
    return this.sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending';
  }

  getDisplayName(column: string): string {
    const columnNames: { [key: string]: string } = {
      'studentid': 'Student ID',
      'firstname': 'First Name',
      'fathername': 'Father Name',
      'grandfathername': 'Grand Father Name',
      'batchcode': 'Batch Code',
      'entryyear': 'Entry Year'
    };
    return columnNames[column] || column;
  }
}
