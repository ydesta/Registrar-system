import { Component, OnInit } from '@angular/core';
import { RegisteredNewStudentViewModel } from '../models/student-profile-view-model.model';
import { AcadamicProgramme } from 'src/app/admission-request/model/acadamic-programme.model';
import { StudentService } from '../services/student.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AcademicProgramRequestService } from 'src/app/admission-request/services/academic-program-request.service';
import { UserManagementService } from 'src/app/services/user-management.service';

@Component({
  selector: 'app-registered-new-student-list',
  templateUrl: './registered-new-student-list.component.html',
  styleUrls: ['./registered-new-student-list.component.scss']
})
export class RegisteredNewStudentListComponent implements OnInit {
  expandSet = new Set<string>();
  tbLoading = false;
  pageindex = 1;
  totalRecord = 0;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  sortOrder = "";
  sortColumn = "";
  listOdRegisteredStudent: RegisteredNewStudentViewModel[] = [];
  filteredStudents: RegisteredNewStudentViewModel[] = [];
  isFormCollapsed = false;
  acadamicProgrammes: AcadamicProgramme[] = [];
  formStudent: FormGroup;
  updateForm: FormGroup;
  isUpdateModalVisible = false;
  updateLoading = false;
  selectedStudent: RegisteredNewStudentViewModel | null = null;

  // Filter properties
  nameFilter = '';
  emailFilter = '';
  phoneFilter = '';
  emailChangedFilter: string | null = null;

  constructor(private studentService: StudentService,
    private _fb: FormBuilder,
    private _academicProgramRequestService: AcademicProgramRequestService,
    private userManagementService: UserManagementService,
  ) {
    this.createStudent();
    this.createUpdateForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadAcademicProgrammes();
  }

  private createStudent() {
    this.formStudent = this._fb.group({
      entryYear: [null],
      academicProgrameCode: [null],
      startDate: [null],
      endDate: [null],
    });
  }

  private createUpdateForm() {
    this.updateForm = this._fb.group({
      newEmail: ['', [Validators.required, Validators.email]]
    });
  }

  public loadData(): void {
    const formModel = this.formStudent.getRawValue();
    this.tbLoading = true;
    const academicProgrameCode = formModel.academicProgrameCode || null;
    const entryYear = formModel.entryYear || null;
    const startDate = formModel.startDate ? this.formatDate(formModel.startDate) : '';
    const endDate = formModel.endDate ? this.formatDate(formModel.endDate) : '';

    this.studentService.getRegisteredNewStudentList(academicProgrameCode, entryYear, startDate, endDate)
      .subscribe({
        next: (res) => {
          this.listOdRegisteredStudent = res;
          this.applyFilters();
          this.totalRecord = this.filteredStudents.length;
          this.tbLoading = false;
          if (res.length > 0) {
            this.isFormCollapsed = true;
          }
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.tbLoading = false;
        }
      });
  }

  // Apply all filters to the data
  private applyFilters(): void {
    this.filteredStudents = this.listOdRegisteredStudent.filter(student => {
      // Name filter
      if (this.nameFilter && !student.fullName.toLowerCase().includes(this.nameFilter.toLowerCase())) {
        return false;
      }

      // Email filter (check both current and previous email)
      if (this.emailFilter) {
        const currentEmailMatch = student.currentEmail?.toLowerCase().includes(this.emailFilter.toLowerCase());
        const previousEmailMatch = student.previousEmail?.toLowerCase().includes(this.emailFilter.toLowerCase());
        if (!currentEmailMatch && !previousEmailMatch) {
          return false;
        }
      }

      // Phone filter
      if (this.phoneFilter && student.phoneNumber && !student.phoneNumber.includes(this.phoneFilter)) {
        return false;
      }

      // Email changed filter
      if (this.emailChangedFilter !== null) {
        const isChanged = this.emailChangedFilter === 'true';
        if (student.isEmailChanged !== isChanged) {
          return false;
        }
      }

      return true;
    });
  }

  // Filter methods
  onNameFilterChange(value: string): void {
    this.nameFilter = value;
    this.applyFilters();
    this.totalRecord = this.filteredStudents.length;
    this.pageindex = 1;
  }

  onEmailFilterChange(value: string): void {
    this.emailFilter = value;
    this.applyFilters();
    this.totalRecord = this.filteredStudents.length;
    this.pageindex = 1;
  }

  onPhoneFilterChange(value: string): void {
    this.phoneFilter = value;
    this.applyFilters();
    this.totalRecord = this.filteredStudents.length;
    this.pageindex = 1;
  }

  onEmailChangedFilterChange(value: string | null): void {
    this.emailChangedFilter = value;
    this.applyFilters();
    this.totalRecord = this.filteredStudents.length;
    this.pageindex = 1;
  }

  // Clear all filters
  clearAllFilters(): void {
    this.nameFilter = '';
    this.emailFilter = '';
    this.phoneFilter = '';
    this.emailChangedFilter = null;
    this.applyFilters();
    this.totalRecord = this.filteredStudents.length;
    this.pageindex = 1;
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }

  onExpandChange(id: string, checked: boolean): void {
    if (checked) {
      this.expandSet.add(id);
    } else {
      this.expandSet.delete(id);
    }
  }

  onPageIndexChange(page: number): void {
    this.pageindex = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageindex = 1;
  }

  onSearch(): void {
    this.pageindex = 1;
    this.loadData();
    this.isFormCollapsed = true;
  }

  onReset(): void {
    this.formStudent.reset();
    this.clearAllFilters();
    this.pageindex = 1;
    this.loadData();
  }

  trackByStudentId(index: number, student: RegisteredNewStudentViewModel): string {
    return student.id;
  }

  viewStudentDetails(student: RegisteredNewStudentViewModel): void {
   
  }

  editStudent(student: RegisteredNewStudentViewModel): void {
    console.log('Edit student:', student);
    this.selectedStudent = student;
    this.updateForm.reset();
    this.isUpdateModalVisible = true;
  }

  handleUpdateModalCancel(): void {
    this.isUpdateModalVisible = false;
    this.selectedStudent = null;
    this.updateForm.reset();
  }

  handleUpdateSubmit(): void {
    if (this.updateForm.valid && this.selectedStudent) {
      this.updateLoading = true;
      const newEmail = this.updateForm.value.newEmail;
      console.log("5555 newEmail     ",newEmail);
      this.studentService.updateStudentEmail(this.selectedStudent.id, newEmail)
        .subscribe({
          next: (response) => {
            console.log('Student email updated successfully:', response);
            const applicationUserId = this.selectedStudent.applicationUserId;
            console.log('ApplicationUserId:  ', applicationUserId);
            if (response.data != 'success') {
              console.error('ApplicationUserId not found for student:', this.selectedStudent);
              this.updateLoading = false;
              return;
            }
            this.userManagementService.updateAdminEmail(applicationUserId, { newEmail })
              .subscribe({
                next: (userResponse) => {
                  console.log('User account updated successfully (email, username, password):', userResponse);
                  this.updateLoading = false;
                  this.isUpdateModalVisible = false;
                  this.selectedStudent = null;
                  this.updateForm.reset();
                  this.loadData();

                },
                error: (userError) => {
                  console.error('Error updating user account:', userError);
                  this.updateLoading = false;
                }
              });
          },
          error: (error) => {
            console.error('Error updating student email:', error);
            this.updateLoading = false;
          }
        });
    }
  }

  loadAcademicProgrammes() {
    this._academicProgramRequestService
      .getAacadamicPrgramtList()
      .subscribe(res => {
        this.acadamicProgrammes = res.data;
      });
  }

  sort(column: string, order: string | null): void {
    this.sortColumn = column;
    this.sortOrder = order || '';

    if (order) {
      this.filteredStudents.sort((a, b) => {
        const aValue = this.getPropertyValue(a, column);
        const bValue = this.getPropertyValue(b, column);

        if (order === 'ascend') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }
  }

  private getPropertyValue(obj: any, property: string): any {
    switch (property) {
      case 'fullName':
        return obj.fullName || '';
      case 'academicProgram':
        return obj.academicProgram || '';
      case 'entryYear':
        return obj.entryYear || 0;
      case 'registeredDate':
        return new Date(obj.registeredDate || '');
      case 'currentEmail':
        return obj.currentEmail || '';
      case 'previousEmail':
        return obj.previousEmail || '';
      case 'phoneNumber':
        return obj.phoneNumber || '';
      case 'isEmailChanged':
        return obj.isEmailChanged ? 1 : 0;
      default:
        return '';
    }
  }
}
