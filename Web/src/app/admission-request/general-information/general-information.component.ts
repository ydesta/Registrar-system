import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NzTabChangeEvent } from "ng-zorro-antd/tabs";
import {
  alphabetsOnlyValidator,
  alphabetsWithSpecialCharsValidator,
  emailValidator,
  etEnAlphabetValidator,
  amharicOnlyValidator,
  englishOnlyValidator,
  phoneValidator
} from "src/app/common/constant";
import { ApplicationRequest } from "../model/application-request.model";
import { GeneralInformationService } from "../services/general-information.service";
import { ActivatedRoute, Router } from "@angular/router";
import { environment } from "src/environments/environment";
import { SharingDataService } from "../services/sharing-data.service";
import { OtherInformation } from "../model/other-information.model";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { SchoolWithStudentAgreementComponent } from '../school-with-student-agreement/school-with-student-agreement.component';

@Component({
  selector: "app-general-information",
  templateUrl: "./general-information.component.html",
  styleUrls: ["./general-information.component.scss"]
})
export class GeneralInformationComponent implements OnInit {
  selectedTabIndex = 0;
  form: FormGroup;
  activeTab = 1;
  formData = new FormData();
  profilePicture = "";
  file_store: FileList;
  file_list: Array<string> = [];
  selectedDate = null;
  id: string;
  userId: string;
  isTabDisabled: boolean[] = [false, true, true, true, true, true, true, true];
  countNoOfContact = 0;
  countNoOfEducation = 0;
  otherForm: FormGroup;
  isSubmittedApplicationForm = 0;
  countSubmitionCourse = 0;
  agreementFormValid = false;
  agreementFormData: any = null;
  paymentStatus: string = 'Not Paid';
  @ViewChild(SchoolWithStudentAgreementComponent)
  schoolAgreementComp: SchoolWithStudentAgreementComponent;


  constructor(
    private fb: FormBuilder,
    private generalInformationService: GeneralInformationService,
    private router: Router,
    private route: ActivatedRoute,
    private sharingDataService: SharingDataService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.userId = localStorage.getItem("userId");
    this.createGeneralInformationForm();
    route.queryParams.subscribe(p => {
      this.id = p["id"];
      if (this.id != undefined) {
        this.getApplicantById(this.id);
      }
    });
    this.createAcademicProgramRequest();
  }
  ngOnInit(): void {
    if (this.id == undefined && this.userId != null) {
      const userId = localStorage.getItem('userId');
      this.generalInformationService.getOrStoreParentApplicantId(userId).subscribe(applicantId => {
        this.id = applicantId;
        this.getApplicantById(applicantId);
      });
    }
    this.disabledDate;
    this.sharingDataService.currentMessage.subscribe(res => {
      this.countNoOfContact = res;
    });
    this.sharingDataService.otherCurrentMessage.subscribe(res => {
      this.countNoOfEducation = res;
    });
    this.sharingDataService.programCurrentMessage.subscribe(res => {
      this.isSubmittedApplicationForm = res;
    });
    this.sharingDataService.numberOfRequestCurrentMessage.subscribe(res => {
      this.countSubmitionCourse = res;
    });

    // Add form value change debugging
    this.form.valueChanges.subscribe(values => {
     
      const firstNameErrors = this.form.get('firstName')?.errors;
      const firstNameInAmhErrors = this.form.get('firstNameInAmh')?.errors;
      
      if (firstNameErrors) {
        console.log('firstName errors:', firstNameErrors);
      }
      if (firstNameInAmhErrors) {
        console.log('firstNameInAmh errors:', firstNameInAmhErrors);
      }
    });
  }
  //#region form Intialization
  createGeneralInformationForm() {
    this.form = this.fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      acadamicProgrammeCode: [""],
      applicantID: [""],
      firstName: ["", [Validators.required, englishOnlyValidator()]],
      fatherName: ["", [Validators.required, englishOnlyValidator()]],
      grandFatherName: ["", [Validators.required, englishOnlyValidator()]],
      firstNameInAmh: ["", [Validators.required, amharicOnlyValidator()]],
      fatherNameInAmh: ["", [Validators.required, amharicOnlyValidator()]],
      grandFatherNameInAmh: ["", [Validators.required, amharicOnlyValidator()]],
      sirName: ["", [alphabetsOnlyValidator()]],
      motherName: [
        "",
        [Validators.required, alphabetsWithSpecialCharsValidator()]
      ],
      gender: ["", [Validators.required]],
      birthDate: [null, [Validators.required]],
      birthPlace: [
        "",
        [Validators.required, alphabetsWithSpecialCharsValidator()]
      ],
      nationality: ["", [Validators.required, alphabetsOnlyValidator()]],
      telephonOffice: ["", phoneValidator()],
      telephonHome: ["", [phoneValidator()]],
      mobile: ["", [Validators.required, phoneValidator()]],
      postalAddress: ["", []],
      emailAddress: ["", [Validators.required, emailValidator()]],
      region: ["", [alphabetsOnlyValidator()]],
      city: ["", []],
      woreda: ["", []],
      kebele: ["", []],
      areaType: ["", []],

      selfConfirmedApplicantInformation: false,
      dateOfApply: null,
      sourceOfFinance: ["", []],
      howDidYouComeKnow: ["", []],
      division: ["", []],
      applicantUserId: [localStorage.getItem("userId")],
      ActualFile: ["", []],
      nationalExaminationId: ["", [Validators.required]],
      tin: ["", []],
      nationalId: ["", [Validators.required]]
    });
  }

  //#endregion
  //#region  getters
  get region() {
    return this.form.get("region");
  }
  get emailAddress() {
    return this.form.get("emailAddress");
  }
  get mobile() {
    return this.form.get("mobile");
  }
  get telephonHome() {
    return this.form.get("telephonHome");
  }
  get telephonOffice() {
    return this.form.get("telephonOffice");
  }
  get nationality() {
    return this.form.get("nationality");
  }
  get birthPlace() {
    return this.form.get("birthPlace");
  }

  get birthDate() {
    return this.form.get("birthDate");
  }
  get gender() {
    return this.form.get("gender");
  }
  get motherName() {
    return this.form.get("motherName");
  }
  get sirName() {
    return this.form.get("sirName");
  }
  get firstName() {
    return this.form.get("firstName");
  }
  get fatherName() {
    return this.form.get("fatherName");
  }
  get grandFatherName() {
    return this.form.get("grandFatherName");
  }
  get firstNameInAmh() {
    return this.form.get("firstNameInAmh");
  }
  get fatherNameInAmh() {
    return this.form.get("fatherNameInAmh");
  }
  get grandFatherNameInAmh() {
    return this.form.get("grandFatherNameInAmh");
  }
  get isAllFormsValid(): boolean {
    const mainFormValid = this.form?.valid;
    if (this.form) {
      const requiredFields = [
        'firstName',
        'fatherName',
        'grandFatherName',
        'motherName',
        'gender',
        'birthDate',
        'birthPlace',
        'nationality',
        'mobile',
        'emailAddress'
      ];
      requiredFields.forEach(field => {
        const control = this.form.get(field);
        if (control?.errors) {
        }
      });
    }

    const hasContacts = this.countNoOfContact > 0;
    const hasEducation = this.countNoOfEducation > 0;
    const hasCourses = this.countSubmitionCourse > 0;
    const isValid = mainFormValid && hasContacts && hasEducation && hasCourses && this.agreementFormValid;
    return isValid;
  }

  get areaType() {
    return this.form.get("areaType");
  }
  get nationalExaminationId() {
    return this.form.get("nationalExaminationId");
  }
  get tin() {
    return this.form.get("tin");
  }
  get nationalId() {
    return this.form.get("nationalId");
  }

  //#endregion
  //#region Form with model Ingeration
  private getApplicantGeneralInfo(): ApplicationRequest {
    const formModel = this.form.getRawValue();
    const generalUserInfo = new ApplicationRequest();

    formModel.ApplicantUserId = this.userId;
    generalUserInfo.firstName = formModel.firstName;
    generalUserInfo.fatherName = formModel.fatherName;
    generalUserInfo.grandFatherName = formModel.grandFatherName;
    generalUserInfo.sirName = formModel.sirName;
    generalUserInfo.motherName = formModel.motherName;
    generalUserInfo.gender = formModel.gender;
    generalUserInfo.birthDate = formModel.birthDate ? formModel.birthDate.toDateString() : "";
    generalUserInfo.birthPlace = formModel.birthPlace;
    generalUserInfo.nationality = formModel.nationality;

    generalUserInfo.city = formModel.city;
    generalUserInfo.emailAddress = formModel.emailAddress;
    generalUserInfo.kebele = formModel.kebele;
    generalUserInfo.mobile = formModel.mobile;
    generalUserInfo.postalAddress = formModel.postalAddress;
    generalUserInfo.region = formModel.region;
    generalUserInfo.telephonHome = formModel.telephonHome;
    generalUserInfo.telephonOffice = formModel.telephonOffice;
    generalUserInfo.woreda = formModel.woreda;

    generalUserInfo.selfConfirmedApplicantInformation =
      formModel.selfConfirmedApplicantInformation;
    generalUserInfo.dateOfApply = formModel.dateOfApply;

    generalUserInfo.howDidYouComeKnow = formModel.howDidYouComeKnow;
    generalUserInfo.sourceOfFinance = formModel.sourceOfFinance;
    generalUserInfo.acadamicProgrammeCode = formModel.acadamicProgrammeCode;

    generalUserInfo.createdBy = formModel.createdBy;
    generalUserInfo.lastModifiedBy = formModel.lastModifiedBy;
    generalUserInfo.firstNameInAmh = formModel.firstNameInAmh;
    generalUserInfo.fatherNameInAmh = formModel.fatherNameInAmh;
    generalUserInfo.grandFatherNameInAmh = formModel.grandFatherNameInAmh;
    generalUserInfo.nationalExaminationId = formModel.nationalExaminationId;
    generalUserInfo.tin = formModel.tin;
    generalUserInfo.nationalId = formModel.nationalId;
    generalUserInfo.areaType = formModel.areaType;

    return generalUserInfo;
  }

  //#endregion

  //#region
  getApplicantById(id: string) {
    this.generalInformationService.getApplicantById(id).subscribe(res => {
      this.form.patchValue(res.data);
      this.otherForm.patchValue(res.data);
      this.profilePicture =
        environment.fileUrl +
        "/Resources/profile/" +
        res.data.files[0]?.fileName;
      setTimeout(() => {
        if (this.schoolAgreementComp && res.data) {
          this.schoolAgreementComp.agreementForm.patchValue({
            sourceOfFinance: res.data.sourceOfFinance,
            howDidYouComeKnow: res.data.howDidYouComeKnow,
            selfConfirmedApplicantInformation: res.data.selfConfirmedApplicantInformation
          });
        }
      });
    });
  }

  //#endregion

  submitForm() {
    const postData = this.getApplicantGeneralInfo();
    postData.applicantUserId = this.userId;
    if (this.id != undefined) {
      postData.id = this.id;
    }
    Object.keys(postData).forEach(key => {
      if (key !== "ActualFile") {
        if (this.formData.get(key) != postData[key]) {
          this.formData.append(key, postData[key]);
        }
      }
    });
    if (this.agreementFormData && Object.keys(this.agreementFormData).length > 0) {
      Object.keys(this.agreementFormData).forEach(key => {
        this.formData.append(key, this.agreementFormData[key]);
      });
    } else {
      console.warn('agreementFormData is missing or empty at submit!');
    }
    if (this.file_store != undefined) {
      for (let i = 0; i < this.file_store.length; i++) {
        this.formData.append("ActualFile", this.file_store[i]);
      }
    }
    for (const pair of (this.formData as any).entries()) {
      console.log('FormData:', pair[0], pair[1]);
    }
    if (this.form.valid) {
      if (this.id == undefined) {
        this.generalInformationService
          .createGeneralInformation(this.formData)
          .subscribe(res => {
            if (res.data != null) {
              this._customNotificationService.notification(
                "success",
                "Success",
                "Admission request is saved successfully."
              );
              this.id = res.data.id;
              this.autoNavigateToNextTab();
            } else {
              this._customNotificationService.notification(
                "warn",
                "Warning",
                "Admission request does not duplicate."
              );
            }
          });
      } else {
        this.generalInformationService
          .updateApplicant(this.id, this.formData)
          .subscribe(res => {
            if (res.data != null) {
              this._customNotificationService.notification(
                "success",
                "Success",
                "Admission request is updated successfully."
              );
              this.autoNavigateToNextTab();
            } else {
              this._customNotificationService.notification(
                "warn",
                "Warning",
                "Admission request does not update."
              );
            }
          });
      }
    } else {
      this.validateAllFormFields(this.form);
    }
  }

  private autoNavigateToNextTab() {
    setTimeout(() => {
      this.isTabDisabled[2] = false;
      this.selectedTabIndex = 2;
      this.router.navigateByUrl(
        `/student-application/admission-request?id=${this.id || 'new'}`
      );
    }, 1500);
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      } else {
        control.markAsDirty();
        control.updateValueAndValidity();
      }
    });
  }
  disabledDate = (current: Date): boolean => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const minDate = new Date(currentDate);
    minDate.setFullYear(currentDate.getFullYear() - 18);
    const selectedDate = new Date(current);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate > minDate;
  };
  nextTab() {
    if (this.selectedTabIndex < 7) {
      this.selectedTabIndex += 1;
      this.isTabDisabled.fill(true);
      this.isTabDisabled[this.selectedTabIndex] = false;
    } else {
    }
  }

  previousTab() {
    if (this.selectedTabIndex > 0) {
      this.selectedTabIndex -= 1;
      this.isTabDisabled.fill(true);
      this.isTabDisabled[this.selectedTabIndex] = false;
    }
  }
  onSelectChange(event: NzTabChangeEvent): void {
    this.activeTab = event.index + 1;
  }

  handleFileInputChange(l: FileList): void {
    this.file_store = l;
    if (l.length) {
      const f = l[0];
      const count = l.length > 1 ? `(+${l.length - 1} files)` : "";
      this.form.patchValue({
        ActualFile: `${f.name}${count}`
      });
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicture = e.target.result;
      };
      reader.readAsDataURL(f);
    } else {
      this.form.patchValue({
        ActualFile: ""
      });
    }
  }

  handleSubmit() {
    var fd = new FormData();
    this.file_list = [];
    for (let i = 0; i < this.file_store.length; i++) {
      fd.append("Files", this.file_store[i]);
      this.file_list.push(this.file_store[i].name);
    }
  }
  createAcademicProgramRequest() {
    this.otherForm = this.fb.group({
      sourceOfFinance: ["", [Validators.required]],
      howDidYouComeKnow: ["", [Validators.required]],
      selfConfirmedApplicantInformation: [null, [Validators.required]]
    });
  }
  private getApplicantOtherInfo(): OtherInformation {
    const formModel = this.agreementFormData;
    const generalUserInfo = new OtherInformation();
    generalUserInfo.applicantID = this.id;
    generalUserInfo.howDidYouComeKnow = formModel.howDidYouComeKnow;
    generalUserInfo.sourceOfFinance = formModel.sourceOfFinance;
    generalUserInfo.selfConfirmedApplicantInformation = formModel.selfConfirmedApplicantInformation;
    return generalUserInfo;
  }
  onApplicanFormSubmit() {
    const postData = this.getApplicantOtherInfo();
    postData.applicantID = this.id;
    this.generalInformationService.finalSubmit(this.id, postData).subscribe(res => {
      this._customNotificationService.notification(
        "success",
        "Success",
        "Application form  is submitted succesfully."
      );
      this.router.navigateByUrl(
        `/student-application/admission-request?id=${this.id}`
      );
    })
  }
  onAgreementFormValidityChange(isValid: boolean) {
    this.agreementFormValid = isValid;
  }
  onAgreementFormValueChange(data: any) {
    this.agreementFormData = data;
  }

  onPaymentStatusChange(status: string) {
    this.paymentStatus = status;
  }

  onPaymentSuccessful() {
    // Automatically navigate to the next tab after successful payment
    this.nextTab();
  }

  testValidation() {
    console.log('=== VALIDATION TEST ===');
    console.log('Form valid:', this.form.valid);
    console.log('Form errors:', this.form.errors);
    console.log('First name value:', this.form.get('firstName')?.value);
    console.log('First name errors:', this.form.get('firstName')?.errors);
    console.log('First name in Amh value:', this.form.get('firstNameInAmh')?.value);
    console.log('First name in Amh errors:', this.form.get('firstNameInAmh')?.errors);
    
    // Test validators directly
    const englishValidator = englishOnlyValidator();
    const amharicValidator = amharicOnlyValidator();
    
    const testEnglish = englishValidator(this.form.get('firstName') as any);
    const testAmharic = amharicValidator(this.form.get('firstNameInAmh') as any);
    
    console.log('English validator test:', testEnglish);
    console.log('Amharic validator test:', testAmharic);
  }
}
