import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { StudentGradeModel } from 'src/app/Models/StudentGradeModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { StudentService } from '../services/student.service';
import { StudentViewModel } from '../models/student-view-model.model';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { ACADEMIC_TERM_STATUS, ACADEMIC_YEAR_NUMBER_STATUS, APPROVAL_STATUS, REGISTARAR_APPROVAL_STATUS } from 'src/app/common/constant';
import { WorkFlowFormComponent } from '../common/work-flow-form/work-flow-form.component';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-course-registration-approval',
  templateUrl: './course-registration-approval.component.html',
  styleUrls: ['./course-registration-approval.component.scss'],
})
export class CourseRegistrationApprovalComponent implements OnInit {
  gradeQueryForm: FormGroup;
  studentId: string = '';
  academicTerms: any;
  registrationForm: FormGroup;
  courseValidation: FormGroup;
  studentRegisterdCourses?: any;
  studentName!: string;
  studentTermCourseReg: StudentViewModel[] = [];
  listOfTermNumber: StaticData[] = [];
  listOfYearNumber: StaticData[] = [];
  approvalStatusList: StaticData[] = [];
  registerApprovalStatusList: StaticData[] = [];
  expandSet = new Set<string>();
  inputTextValue = "";
  acceptButtonDisabled: boolean[] = [];
  rejectButtonDisabled: boolean[] = [];
  constructor(
    private _crudService: CrudService,
    private _fb: FormBuilder,
    private _customNotificationService: CustomNotificationService,
    private _studentService: StudentService,
    private _modal: NzModalService,
    private _authService: AuthService
  ) {

    this.createForm();
  }
  ngOnInit(): void {
    this.getListOfAcademicTermStatus();
    this.getListOfYearNumberStatus();
    this.getListOfApprovalStatus();
    this.getStudentCourseRegistrationList();
    this.getListOfRegisteraApprovalStatus();

  }
  private createForm() {
    this.gradeQueryForm = this._fb.group({
      remark: [''],
    });
  }
  populateIntialData() {
    this._crudService
      .getList('/academicTerms')
      .subscribe((res: BaseModel<StudentGradeModel[]>) => {
        this.academicTerms = res.data;
      });
  }

  fetchCourses() {
    this.courseValidation.value['acadamicTermCode'] =
      this.gradeQueryForm.value['academicTermCode'];
    this.courseValidation.value['batchCode'] =
      this.gradeQueryForm.value['batchCode'];
    this.courseValidation.value['studentId'] = this.studentId;
    this._crudService
      .add(
        '/StudentRegistrations/StudentCourseRegValidation',
        this.courseValidation.value
      )
      .subscribe((res: any) => {
        this.studentRegisterdCourses = res.data;
        this.studentName = this.studentRegisterdCourses[0].student.firstName;
      });
  }

  acceptRejectCourse(id: number, status: number, index: number) {
    if (status === 2) {
      this.acceptButtonDisabled[index] = true;
      this.rejectButtonDisabled[index] = false;
    } else if (status === 3) {
      this.rejectButtonDisabled[index] = true;
      this.acceptButtonDisabled[index] = false;
    }
    this._studentService.updateStudentCourseTaken(id, status)
      .subscribe(res => {
        if (res == true) {
          this._customNotificationService.notification(
            "success",
            "Success",
            "Submitted  succesfully."
          );

        } else {
          this._customNotificationService.notification(
            "success",
            "Success",
            "Does not Submitted "
          );
        }
      })
  }
  rejectCourse(id: string) {
    this._crudService
      .update('/StudentRegistrations/approval', id, {
        status: 'Rejected',
      })
      .subscribe((res: any) => {
        this._customNotificationService.notification(
          res.status,
          'Success',
          res.data
        );
        this.fetchCourses();
      });
  }

  getStudentCourseRegistrationList() {
    this._studentService.getStudentCourseRegistrationList().subscribe(res => {
      this.studentTermCourseReg = res;
    })
  }

  onExpandChange(id: string, checked: boolean): void {
    if (checked) {
      this.expandSet.add(id);
    } else {
      this.expandSet.delete(id);
    }
  }

  getCourseDetails(data: any): any[] {
    if (data.courseTermOfferings && data.courseTermOfferings.length > 0) {
      return data.courseTermOfferings.map((c, index) => {
        return {
          id: c.id,
          number: index + 1,
          title: c.courseTitle,
          code: c.courseCode,
          creditHours: c.creditHours,
          status: c.status
        };
      });
    }
    return [];
  }
  getTotalCreditHours(data: any): number {
    let totalCreditHours = 0;
    if (data.courseTermOfferings && data.courseTermOfferings.length > 0) {
      data.courseTermOfferings.forEach(c => {
        totalCreditHours += c.creditHours;
      });
    }
    return totalCreditHours;
  }
  getListOfRegisteraApprovalStatus() {
    let division: StaticData = new StaticData();
    REGISTARAR_APPROVAL_STATUS.forEach(pair => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description
      };
      this.registerApprovalStatusList.push(division);
    });
  }
  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach(pair => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description
      };
      this.listOfTermNumber.push(division);
    });
  }
  getListOfApprovalStatus() {
    let division: StaticData = new StaticData();
    APPROVAL_STATUS.forEach(pair => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description
      };
      this.approvalStatusList.push(division);
    });
  }
  getListOfYearNumberStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_YEAR_NUMBER_STATUS.forEach(pair => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description
      };
      this.listOfYearNumber.push(division);
    });
  }
  getCourseStatusDescription(Id: any) {
    const program = this.registerApprovalStatusList.find(item => item.Id == Id);
    return program ? program.Description : "";
  }
  getApprovalStatusDescription(Id: any) {
    const program = this.approvalStatusList.find(item => item.Id == Id);
    return program ? program.Description : "";
  }
  getYearNumberDescription(Id: any) {
    const program = this.listOfYearNumber.find(item => item.Id == Id);
    return program ? program.Description : "";
  }

  getAcademicTermStatusDescription(Id: any) {
    const program = this.listOfTermNumber.find(item => item.Id == Id);
    return program ? program.Description : "";
  }
  openModal(data: any): void {
    const modal: NzModalRef = this._modal.create({
      // nzTitle: "Workflow Form",
      nzContent: WorkFlowFormComponent,
      nzComponentParams: {
        termCourseOfferingId: data.termCourseOfferingId,
        fullName: data.fullName,
        status: data.status
      },
      nzMaskClosable: false,
      nzFooter: null
    });
    modal.afterClose.subscribe(() => {
      this.getStudentCourseRegistrationList();
    });
  }
  onSubmit(data: any) {
    this._studentService.updateStudentCourseOffering(data.termCourseOfferingId)
      .subscribe(res => {
        if (res == true) {
          this._customNotificationService.notification(
            "success",
            "Success",
            "Submitted  Successfully."
          );
          this.getStudentCourseRegistrationList();
          location.reload();
        } else {
          this._customNotificationService.notification(
            "success",
            "Success",
            "Does not Submitted "
          );
        }
      })
  }
}
