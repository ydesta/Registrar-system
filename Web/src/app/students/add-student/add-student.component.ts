import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../services/student.service';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { TermCourseOfferingService } from 'src/app/colleges/services/term-course-offering.service';

@Component({
  selector: 'app-add-student',
  templateUrl: './add-student.component.html',
  styleUrls: ['./add-student.component.scss']
})
export class AddStudentComponent implements OnInit {
  action = 'Add Student';
  form: FormGroup;
  loading = false;
  profilePicture = '';
  acadamicPrograms: any;
  progStatusId: any;
  curricula: any;
  applicants: any;
  staffs: any;
  batchs: any;
  submit = 'Submit';
  initials: string = '';

  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router, 
    private _fb: FormBuilder,
    private _studentService: StudentService, 
    private _crudService: CrudService,
    private _termCourseOfferingService: TermCourseOfferingService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.createGeneralInformationForm();
  }

  ngOnInit(): void {
    this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
    if (this.progStatusId != "null") {
      this.action = 'Edit Student';
      this.submit = 'Update';
      this._studentService.getStudentById(this.progStatusId).subscribe((res: any) => {
        console.log("%%%          ", res);
        this.patchValues(res.data);
      });
    }
    this.loadDropdownData();
    this.form.valueChanges.subscribe(() => {
      this.updateInitials();
    });

    this.form.get('batchCode')?.valueChanges.subscribe((batchCode) => {
      if (batchCode && !this.form.get('offerBatchCode')?.value) {
        this.form.patchValue({ offerBatchCode: batchCode });
      }
    });
  }

  createGeneralInformationForm() {
    this.form = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      acadamicProgrammeCode: [""],
      applicantID: [""],
      firstName: ["", [Validators.required]],
      fatherName: ["", Validators.required],
      grandFatherName: ["", Validators.required],
      firstNameInAmh: ["", [Validators.required]],
      fatherNameInAmh: ["", [Validators.required]],
      grandFatherNameInAmh: ["", [Validators.required]],
      sirName: [""],
      motherName: ["", [Validators.required]],
      gender: ["", [Validators.required]],
      birthDate: [null, [Validators.required]],
      birthPlace: ["", [Validators.required]],
      nationality: ["", [Validators.required]],
      telephonOffice: [""],
      telephonHome: [""],
      mobile: ["", [Validators.required]],
      postalAddress: [""],
      emailAddress: ["", [Validators.required]],
      region: ["", [Validators.required]],
      city: [""],
      woreda: [""],
      kebele: [""],
      areaType: [""],
      nationalExaminationId: ["", [Validators.required]],
      tin: [""],
      nationalId: ["", [Validators.required]],
      selfConfirmedApplicantInformation: false,
      dateOfApply: null,
      sourceOfFinance: [""],
      howDidYouComeKnow: [""],
      division: [""],
      ApplicantUserId: [localStorage.getItem("userId")],
      ActualFile: [""],
      // Academic fields
      curriculumCode: ['', Validators.required],
      batchCode: ['', Validators.required],
      entryYear: ['', Validators.required],
      studentId: ['', Validators.required],
      // Registration fields
      isAllowedToRegister: [0, Validators.required],
      offerBatchCode: [''],
      // Student Status
      studentStatus: [1, Validators.required]
    });
  }

  loadDropdownData() {
    this._crudService.getList('/Curriculums').subscribe((res: any) => {
      this.curricula = res.data;
    });
    this._crudService.getList('/applicants').subscribe((res: any) => {
      this.applicants = res.data;
    });
    this._termCourseOfferingService.getBatchList().subscribe((res: any) => {
      this.batchs = res.data;
    });
  }

  submitForm() {
    if (this.form.valid) {
      this.loading = true;
      if (this.progStatusId == "null") {
        this._studentService.addStudent(this.form.value).subscribe((res: any) => {
          this._customNotificationService.notification('success', 'Success', res.data);
          this._route.navigateByUrl('students');
          this.loading = false;
        }, error => {
          this.loading = false;
        });
      } else if (this.progStatusId != "null") {
        this._studentService.updateStudent(this.progStatusId, this.form.value).subscribe((res: any) => {
          if (res.status == 'success') {
            this._customNotificationService.notification('success', 'Success', res.data);
            this._route.navigateByUrl('students');
          } else {
            this._customNotificationService.notification('error', 'Error', res.data);
          }
          this.loading = false;
        }, error => {
          this.loading = false;
        });
      }
    } else {
      this._customNotificationService.notification('error', 'error', 'Enter valid data.');
    }
  }

  patchValues(data: any) {
    this.form.patchValue({
      applicantID: data.applicantID,
      firstName: data.firstName,
      fatherName: data.fatherName,
      grandFatherName: data.grandFatherName,
      firstNameInAmh: data.firstNameInAmh,
      fatherNameInAmh: data.fatherNameInAmh,
      grandFatherNameInAmh: data.grandFatherNameInAmh,
      sirName: data.sirName,
      motherName: data.motherName,
      gender: data.gender,
      birthDate: data.birthDate,
      birthPlace: data.birthPlace,
      nationality: data.nationality,
      telephonOffice: data.telephonOffice,
      telephonHome: data.telephonHome,
      mobile: data.mobile,
      postalAddress: data.postalAddress,
      emailAddress: data.emailAddress,
      region: data.region,
      city: data.city,
      woreda: data.woreda,
      kebele: data.kebele,
      areaType: data.areaType,
      nationalExaminationId: data.nationalExaminationId,
      tin: data.tin,
      nationalId: data.nationalId,
      curriculumCode: data.curriculumCode,
      batchCode: data.batchCode,
      entryYear: data.entryYear,
      studentId: data.studentId,
      isAllowedToRegister: data.isAllowedToRegister !== undefined ? data.isAllowedToRegister : 0,
      offerBatchCode: data.offerBatchCode || data.batchCode || '',
      studentStatus: (data.studentStatus !== undefined && data.studentStatus !== null && data.studentStatus > 0) ? data.studentStatus : 1
    });
    
    // Debug: Check if the value was set correctly
    setTimeout(() => {
    }, 100);
  }

  goBack() {
    this._route.navigateByUrl('students');
  }

  getInitials(): string {
    const firstName = this.form.get('firstName')?.value || '';
    const fatherName = this.form.get('fatherName')?.value || '';
    const grandFatherName = this.form.get('grandFatherName')?.value || '';
    
    const firstInitial = firstName.charAt(0).toUpperCase();
    const fatherInitial = fatherName.charAt(0).toUpperCase();
    const grandFatherInitial = grandFatherName.charAt(0).toUpperCase();
    
    return firstInitial + fatherInitial + grandFatherInitial;
  }

  updateInitials() {
    this.initials = this.getInitials();
  }

 
}
