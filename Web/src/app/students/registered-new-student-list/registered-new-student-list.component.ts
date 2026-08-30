import { Component, OnDestroy, OnInit } from '@angular/core';
import { RegisteredNewStudentViewModel } from '../models/student-profile-view-model.model';
import { AcadamicProgramme } from 'src/app/admission-request/model/acadamic-programme.model';
import { StudentService } from '../services/student.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AcademicProgramRequestService } from 'src/app/admission-request/services/academic-program-request.service';
import { UserManagementService } from 'src/app/services/user-management.service';
import { SecureLoggerService } from 'src/app/services/secure-logger.service';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';

@Component({
  selector: 'app-registered-new-student-list',
  templateUrl: './registered-new-student-list.component.html',
  styleUrls: ['./registered-new-student-list.component.scss']
})
export class RegisteredNewStudentListComponent implements OnInit, OnDestroy {
  expandSet = new Set<string>();
  listOdRegisteredStudent: RegisteredNewStudentViewModel[] = [];
  filteredStudents: RegisteredNewStudentViewModel[] = [];
  pager: ServerPaginator;
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

  constructor(
    private studentService: StudentService,
    private _fb: FormBuilder,
    private _academicProgramRequestService: AcademicProgramRequestService,
    private userManagementService: UserManagementService,
    private _logger: SecureLoggerService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    this.createStudent();
    this.createUpdateForm();
  }

  ngOnInit(): void {
    this.pager.init(() => this.loadData());
    this.loadData();
    this.loadAcademicProgrammes();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
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
    this.pager.loading = true;
    const extra = {
      academicProgrameCode: formModel.academicProgrameCode || null,
      entryYear: formModel.entryYear || null,
      startDate: formModel.startDate ? this.formatDate(formModel.startDate) : '',
      endDate: formModel.endDate ? this.formatDate(formModel.endDate) : '',
      name: this.nameFilter,
      email: this.emailFilter,
      phone: this.phoneFilter,
      isEmailChanged: this.emailChangedFilter
    };
    this.studentService.getRegisteredNewStudentListPaginated(this.pager.query(extra))
      .subscribe({
        next: (res: any) => {
          this.filteredStudents = res.data || [];
          this.listOdRegisteredStudent = this.filteredStudents;
          this.pager.applyResult(res);
          if (this.pager.total > 0) {
            this.isFormCollapsed = true;
          }
        },
        error: () => {
          this.filteredStudents = [];
          this.listOdRegisteredStudent = [];
          this.pager.fail();
        }
      });
  }

  onNameFilterChange(value: string): void {
    this.nameFilter = value;
    this.pager.onFilterChange();
  }

  onEmailFilterChange(value: string): void {
    this.emailFilter = value;
    this.pager.onFilterChange();
  }

  onPhoneFilterChange(value: string): void {
    this.phoneFilter = value;
    this.pager.onFilterChange();
  }

  onEmailChangedFilterChange(value: string | null): void {
    this.emailChangedFilter = value;
    this.pager.resetPage();
  }

  clearAllFilters(): void {
    this.nameFilter = '';
    this.emailFilter = '';
    this.phoneFilter = '';
    this.emailChangedFilter = null;
    this.pager.resetPage();
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

  onSearch(): void {
    this.isFormCollapsed = true;
    this.pager.resetPage();
  }

  onReset(): void {
    this.formStudent.reset();
    this.nameFilter = '';
    this.emailFilter = '';
    this.phoneFilter = '';
    this.emailChangedFilter = null;
    this.pager.resetPage();
  }

  trackByStudentId(index: number, student: RegisteredNewStudentViewModel): string {
    return student.id;
  }

  viewStudentDetails(student: RegisteredNewStudentViewModel): void {
   
  }

  editStudent(student: RegisteredNewStudentViewModel): void {
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
      this.studentService.updateStudentEmail(this.selectedStudent.id, newEmail)
        .subscribe({
          next: (response) => {
            const applicationUserId = this.selectedStudent.applicationUserId;
            if (response.data != 'success') {
              this.updateLoading = false;
              return;
            }
            this.userManagementService.updateAdminEmail(applicationUserId, { newEmail })
              .subscribe({
                next: (userResponse) => {
                  this._logger.debug('User account updated successfully');
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
    this.pager.onSort(order, column);
  }
}
