import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from "@angular/forms";
import { NzTabChangeEvent } from "ng-zorro-antd/tabs";
import { NzModalService } from "ng-zorro-antd/modal";
import {
  alphabetsOnlyValidator,
  alphabetsWithSpecialCharsValidator,
  emailValidator,
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
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { ReviewSummaryService, ReviewSummaryData } from "../services/review-summary.service";

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
  academicProgramValid: boolean = false;
  paymentStatus: string = 'Not Paid';
  saveLoading: boolean = false;
  saveSuccess: boolean = false;
  reviewSummaryData: any = {};
  isApplicationSubmitted: boolean = false;
  reviewSubmissionLoading: boolean = false;
  @ViewChild(SchoolWithStudentAgreementComponent)
  schoolAgreementComp: SchoolWithStudentAgreementComponent;
  currentModalRef: any;

  constructor(
    private fb: FormBuilder,
    private generalInformationService: GeneralInformationService,
    private router: Router,
    private route: ActivatedRoute,
    private sharingDataService: SharingDataService,
    private _customNotificationService: CustomNotificationService,
    private modal: NzModalService,
    private reviewSummaryService: ReviewSummaryService
  ) {
    this.userId = localStorage.getItem("userId");
    this.createGeneralInformationForm();
    this.createAcademicProgramRequest();
    this.setInitialTabState();
    
    route.queryParams.subscribe(p => {
      this.id = p["id"];
      if (this.id != undefined) {
        this.getApplicantById(this.id);
      }
    });
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
    

    
    this.sharingDataService.currentMessage.pipe(distinctUntilChanged()).subscribe(res => {
      this.countNoOfContact = res;
      this.updateTabDisabledStateOptimized();
    });
    this.sharingDataService.otherCurrentMessage.pipe(distinctUntilChanged()).subscribe(res => {
      this.countNoOfEducation = res;
      this.updateTabDisabledStateOptimized();
    });
    this.sharingDataService.programCurrentMessage.pipe(distinctUntilChanged()).subscribe(res => {
      this.isSubmittedApplicationForm = res;
      this.updateTabDisabledStateOptimized();
    });
    this.sharingDataService.numberOfRequestCurrentMessage.pipe(distinctUntilChanged()).subscribe(res => {
      this.countSubmitionCourse = res;
      this.updateTabDisabledStateOptimized();
    });

    this.form.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.updateTabDisabledStateOptimized();
    });

    this.updateTabDisabledStateOptimized();
  }

  createGeneralInformationForm() {
    this.form = this.fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      acadamicProgrammeCode: [""],
      applicantID: [""],
      profilePicture: ["", [Validators.required]],
      firstName: ["", [Validators.required, englishOnlyValidator()]],
      fatherName: ["", [Validators.required, englishOnlyValidator()]],
      grandFatherName: ["", [Validators.required, englishOnlyValidator()]],
      firstNameInAmh: ["", [amharicOnlyValidator()]],
      fatherNameInAmh: ["", [amharicOnlyValidator()]],
      grandFatherNameInAmh: ["", [amharicOnlyValidator()]],
      sirName: ["", [alphabetsOnlyValidator()]],
      motherName: [
        "",
        [Validators.required, alphabetsWithSpecialCharsValidator()]
      ],
      gender: ["", [Validators.required]],
      birthDate: [null, [Validators.required, this.birthDateValidator()]],
      birthPlace: [
        "",
        [Validators.required, alphabetsWithSpecialCharsValidator()]
      ],
      nationality: ["", [Validators.required]],
      telephonOffice: ["", phoneValidator()],
      telephonHome: ["", [phoneValidator()]],
      mobile: ["", [Validators.required, phoneValidator()]],
      postalAddress: ["", []],
      emailAddress: ["", [Validators.required, emailValidator()]],
      region: ["", [Validators.required, alphabetsOnlyValidator()]],
      city: ["", []],
      woreda: ["", []],
      kebele: ["", []],
      areaType: ["", []],
      selfConfirmedApplicantInformation: false,
      dateOfApply: [new Date(), []],
      sourceOfFinance: ["", []],
      howDidYouComeKnow: ["", []],
      division: ["", []],
      applicantUserId: [localStorage.getItem("userId")],
      ActualFile: ["", []],
      nationalExaminationId: ["", []],
      tin: ["", []],
      nationalId: ["", []]
    });
  }

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
    const generalInfoValid = this.form.valid;
    const contactPersonValid = this.countNoOfContact > 0;
    const educationValid = this.countNoOfEducation > 0;
    const academicProgramValid = this.isAcademicProgramValid;
    const agreementValid = this.agreementFormValid;
    
    if (this.paymentStatus === 'Paid') {
      return true;
    }
    
    return generalInfoValid && contactPersonValid && educationValid && academicProgramValid && agreementValid;
  }

  get isAcademicProgramValid(): boolean {
    const hasAcademicProgramRequests = this.countSubmitionCourse > 0;
    return hasAcademicProgramRequests;
  }

  public isNextButtonDisabled(): boolean {
    switch (this.selectedTabIndex) {
      case 0:
        return false;
      case 1:
        return !this.id || !this.form?.valid;
      case 2:
        return this.countNoOfContact === 0;
      case 3:
        return this.countNoOfEducation === 0;
      case 4:
        return false;
      case 5:
        return !this.isAcademicProgramValid;
      case 6:
        return this.paymentStatus !== 'Paid';
      case 7:
        return !this.agreementFormValid;
      default:
        return true;
    }
  }

  get isSubmitButtonDisabled(): boolean {
    if (this.isApplicationSubmitted) {
      return true;
    }
    
    if (this.isSubmittedApplicationForm === 1) {
      return true;
    }
    
    return this.selectedTabIndex !== 7 || !this.agreementFormValid;
  }

  get isAcademicProgramProcessed(): boolean {
    return this.isSubmittedApplicationForm === 1;
  }

  get isSaveButtonDisabled(): boolean {
    return !this.form?.valid || this.isAcademicProgramProcessed;
  }

  private collectReviewSummaryData(): ReviewSummaryData {
    const summary: ReviewSummaryData = {
      generalInformation: {
        personalInfo: {
          firstName: this.form.get('firstName')?.value || '',
          firstNameInAmh: this.form.get('firstNameInAmh')?.value || '',
          sirName: this.form.get('sirName')?.value || '',
          fatherName: this.form.get('fatherName')?.value || '',
          fatherNameInAmh: this.form.get('fatherNameInAmh')?.value || '',
          grandFatherName: this.form.get('grandFatherName')?.value || '',
          grandFatherNameInAmh: this.form.get('grandFatherNameInAmh')?.value || '',
          motherName: this.form.get('motherName')?.value || '',
          gender: this.form.get('gender')?.value || '',
          birthDate: this.form.get('birthDate')?.value,
          birthPlace: this.form.get('birthPlace')?.value || '',
          nationality: this.form.get('nationality')?.value || ''
        },
        contactInfo: {
          emailAddress: this.form.get('emailAddress')?.value || '',
          mobile: this.form.get('mobile')?.value || '',
          telephonHome: this.form.get('telephonHome')?.value || '',
          telephonOffice: this.form.get('telephonOffice')?.value || ''
        },
        addressInfo: {
          region: this.form.get('region')?.value || '',
          city: this.form.get('city')?.value || '',
          woreda: this.form.get('woreda')?.value || '',
          kebele: this.form.get('kebele')?.value || ''
        },
        identificationInfo: {
          nationalId: this.form.get('nationalId')?.value || '',
          nationalExaminationId: this.form.get('nationalExaminationId')?.value || '',
          tin: this.form.get('tin')?.value || ''
        }
      },
      contactPerson: {
        count: this.countNoOfContact,
        hasContacts: this.countNoOfContact > 0
      },
      education: {
        count: this.countNoOfEducation,
        hasEducation: this.countNoOfEducation > 0
      },
      workExperience: {
        hasWorkExperience: true
      },
      academicProgram: {
        count: this.countSubmitionCourse,
        hasPrograms: this.countSubmitionCourse > 0,
        isValid: this.isAcademicProgramValid
      },
      applicationFee: {
        status: this.paymentStatus,
        isPaid: this.paymentStatus === 'Paid'
      },
      agreement: {
        sourceOfFinance: this.agreementFormData?.sourceOfFinance || '',
        howDidYouComeKnow: this.agreementFormData?.howDidYouComeKnow || '',
        selfConfirmedApplicantInformation: this.agreementFormData?.selfConfirmedApplicantInformation || false,
        isValid: this.agreementFormValid
      }
    };

    return summary;
  }

  private updateTabDisabledState(): void {
    this.isTabDisabled = [
      false,
      false,
      this.countNoOfContact === 0,
      this.countNoOfEducation === 0,
      false,
      !this.form?.valid,
      !this.isAcademicProgramValid,
      !this.isAllFormsValid
    ];
  }

  private updateTabDisabledStateOptimized(): void {
    const newTabDisabled = [
      this.selectedTabIndex !== 0,
      this.selectedTabIndex !== 1,
      this.selectedTabIndex !== 2,
      this.selectedTabIndex !== 3,
      this.selectedTabIndex !== 4,
      this.selectedTabIndex !== 5,
      this.selectedTabIndex !== 6,
      this.selectedTabIndex !== 7
    ];

    const hasChanged = this.isTabDisabled.some((disabled, index) => disabled !== newTabDisabled[index]);
    
    if (hasChanged) {
      this.isTabDisabled = newTabDisabled;
    }
  }

  private setInitialTabState(): void {
    this.isTabDisabled = [
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ];
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

  private safeDateConversion(dateValue: any): Date | null {
    if (!dateValue) return null;

    let dateObj: Date | null = null;

    if (dateValue instanceof Date) {
      dateObj = dateValue;
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }

    if (dateObj) {
      return new Date(
        Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
      );
    }

    return null;
  }

  private formatDateForBackend(dateValue: any): string | null {
    if (!dateValue) return null;
    
    try {
      let dateObj: Date;
      
      if (dateValue instanceof Date) {
        dateObj = dateValue;
      } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        dateObj = new Date(dateValue);
      } else {
        dateObj = new Date(dateValue);
      }
      
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0];
      }
    } catch (error) {
      return null;
    }
    
    return null;
  }

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
    generalUserInfo.birthDate = this.safeDateConversion(formModel.birthDate);
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
    generalUserInfo.dateOfApply = this.safeDateConversion(formModel.dateOfApply);

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

  getApplicantById(id: string) {
    this.generalInformationService.getApplicantById(id).subscribe(res => {
      const formData = { ...res.data };

      if (formData.birthDate && typeof formData.birthDate === 'string') {
        try {
          const dateObj = new Date(formData.birthDate);
          if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() > 1900) {
            formData.birthDate = dateObj;
          } else {
            formData.birthDate = null;
          }
        } catch (error) {
          formData.birthDate = null;
        }
      }

      if (formData.dateOfApply && typeof formData.dateOfApply === 'string') {
        try {
          const dateObj = new Date(formData.dateOfApply);
          if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() > 1900) {
            formData.dateOfApply = dateObj;
          } else {
            formData.dateOfApply = new Date();
          }
        } catch (error) {
          formData.dateOfApply = new Date();
        }
      } else if (!formData.dateOfApply || formData.dateOfApply === null) {
        formData.dateOfApply = new Date();
      }

      this.form.patchValue(formData);

      const academicProgramData = {
        sourceOfFinance: res.data.sourceOfFinance || res.data.sourceOfFinanceId || res.data.financeSource || '',
        howDidYouComeKnow: res.data.howDidYouComeKnow || res.data.howDidYouComeKnowId || res.data.referralSource || '',
        selfConfirmedApplicantInformation: res.data.selfConfirmedApplicantInformation === true ||
          res.data.selfConfirmedApplicantInformation === 'true' ||
          res.data.selfConfirmedApplicantInformation === 1 ||
          false
      };

      this.otherForm.patchValue(academicProgramData);
      this.otherForm.markAsTouched();

      this.profilePicture =
        environment.fileUrl +
        "/Resources/profile/" +
        res.data.files[0]?.fileName;

      if (res.data.files && res.data.files.length > 0 && res.data.files[0]?.fileName) {
        this.form.patchValue({
          profilePicture: res.data.files[0].fileName
        });
      }

      this.updateTabDisabledStateOptimized();

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

  submitForm() {
    this.saveLoading = true;

    const formData = new FormData();
    
    const postData = this.getApplicantGeneralInfo();
    postData.applicantUserId = this.userId;
    if (this.id != undefined) {
      postData.id = this.id;
    }
    
    Object.keys(postData).forEach(key => {
      if (key !== "ActualFile") {
        let value = postData[key];
        
        if (key === 'birthDate' || key === 'dateOfApply') {
          if (value instanceof Date) {
            if (!isNaN(value.getTime())) {
              value = value.toISOString().split('T')[0];
            } else {
              value = '';
            }
          } else if (typeof value === 'string') {
            try {
              const dateObj = new Date(value);
              if (!isNaN(dateObj.getTime())) {
                value = dateObj.toISOString().split('T')[0];
              } else {
                value = '';
              }
            } catch (error) {
              value = '';
            }
          } else if (value === null || value === undefined) {
            value = '';
          } else {
            try {
              const dateObj = new Date(value);
              if (!isNaN(dateObj.getTime())) {
                value = dateObj.toISOString().split('T')[0];
              } else {
                value = '';
              }
            } catch (error) {
              value = '';
            }
          }
        }
        
        formData.append(key, value);
      }
    });
    
    if (this.agreementFormData && Object.keys(this.agreementFormData).length > 0) {
      Object.keys(this.agreementFormData).forEach(key => {
        formData.append(key, this.agreementFormData[key]);
      });
    }
    
    if (this.file_store != undefined) {
      for (let i = 0; i < this.file_store.length; i++) {
        formData.append("ActualFile", this.file_store[i]);
      }
    }
    
    if (this.form.valid) {
      if (this.id == undefined) {
        this.generalInformationService
          .createGeneralInformation(formData)
          .subscribe({
            next: (res) => {
              this.saveLoading = false;
              if (res.data != null) {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  "Admission request is saved successfully."
                );
                this.id = res.data.id;
                this.saveSuccess = true;
                setTimeout(() => {
                  this.saveSuccess = false;
                }, 2000);
                this.autoNavigateToNextTab();
              } else {
                this._customNotificationService.notification(
                  "warn",
                  "Warning",
                  "Admission request does not duplicate."
                );
              }
            },
            error: (error) => {
              this.saveLoading = false;
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to save admission request. Please try again."
              );
            }
          });
      } else {
        this.generalInformationService
          .updateApplicant(this.id, formData)
          .subscribe({
            next: (res) => {
              this.saveLoading = false;
              if (res.data != null) {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  "Admission request is updated successfully."
                );
                this.saveSuccess = true;
                setTimeout(() => {
                  this.saveSuccess = false;
                }, 2000);
                this.autoNavigateToNextTab();
              } else {
                this._customNotificationService.notification(
                  "warn",
                  "Warning",
                  "Admission request does not update."
                );
              }
            },
            error: (error) => {
              this.saveLoading = false;
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to update admission request. Please try again."
              );
            }
          });
      }
    } else {
      this.saveLoading = false;
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
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      } else {
        control.markAsDirty();
      }
    });
  }



  // Countries list with flags and nationalities
  countries = [
    { name: 'Afghanistan', nationality: 'Afghan', flag: '🇦🇫' },
    { name: 'Albania', nationality: 'Albanian', flag: '🇦🇱' },
    { name: 'Algeria', nationality: 'Algerian', flag: '🇩🇿' },
    { name: 'Argentina', nationality: 'Argentine', flag: '🇦🇷' },
    { name: 'Australia', nationality: 'Australian', flag: '🇦🇺' },
    { name: 'Austria', nationality: 'Austrian', flag: '🇦🇹' },
    { name: 'Bangladesh', nationality: 'Bangladeshi', flag: '🇧🇩' },
    { name: 'Belgium', nationality: 'Belgian', flag: '🇧🇪' },
    { name: 'Brazil', nationality: 'Brazilian', flag: '🇧🇷' },
    { name: 'Bulgaria', nationality: 'Bulgarian', flag: '🇧🇬' },
    { name: 'Cambodia', nationality: 'Cambodian', flag: '🇰🇭' },
    { name: 'Cameroon', nationality: 'Cameroonian', flag: '🇨🇲' },
    { name: 'Canada', nationality: 'Canadian', flag: '🇨🇦' },
    { name: 'Chile', nationality: 'Chilean', flag: '🇨🇱' },
    { name: 'China', nationality: 'Chinese', flag: '🇨🇳' },
    { name: 'Colombia', nationality: 'Colombian', flag: '🇨🇴' },
    { name: 'Costa Rica', nationality: 'Costa Rican', flag: '🇨🇷' },
    { name: 'Croatia', nationality: 'Croatian', flag: '🇭🇷' },
    { name: 'Cuba', nationality: 'Cuban', flag: '🇨🇺' },
    { name: 'Czech Republic', nationality: 'Czech', flag: '🇨🇿' },
    { name: 'Denmark', nationality: 'Danish', flag: '🇩🇰' },
    { name: 'Dominican Republic', nationality: 'Dominican', flag: '🇩🇴' },
    { name: 'Ecuador', nationality: 'Ecuadorian', flag: '🇪🇨' },
    { name: 'Egypt', nationality: 'Egyptian', flag: '🇪🇬' },
    { name: 'El Salvador', nationality: 'Salvadoran', flag: '🇸🇻' },
    { name: 'Eritrea', nationality: 'Eritrean', flag: '🇪🇷' },
    { name: 'Estonia', nationality: 'Estonian', flag: '🇪🇪' },
    { name: 'Ethiopia', nationality: 'Ethiopian', flag: '🇪🇹' },
    { name: 'Finland', nationality: 'Finnish', flag: '🇫🇮' },
    { name: 'France', nationality: 'French', flag: '🇫🇷' },
    { name: 'Germany', nationality: 'German', flag: '🇩🇪' },
    { name: 'Ghana', nationality: 'Ghanaian', flag: '🇬🇭' },
    { name: 'Greece', nationality: 'Greek', flag: '🇬🇷' },
    { name: 'Guatemala', nationality: 'Guatemalan', flag: '🇬🇹' },
    { name: 'Haiti', nationality: 'Haitian', flag: '🇭🇹' },
    { name: 'Honduras', nationality: 'Honduran', flag: '🇭🇳' },
    { name: 'Hong Kong', nationality: 'Hong Konger', flag: '🇭🇰' },
    { name: 'Hungary', nationality: 'Hungarian', flag: '🇭🇺' },
    { name: 'Iceland', nationality: 'Icelandic', flag: '🇮🇸' },
    { name: 'India', nationality: 'Indian', flag: '🇮🇳' },
    { name: 'Indonesia', nationality: 'Indonesian', flag: '🇮🇩' },
    { name: 'Iran', nationality: 'Iranian', flag: '🇮🇷' },
    { name: 'Iraq', nationality: 'Iraqi', flag: '🇮🇶' },
    { name: 'Ireland', nationality: 'Irish', flag: '🇮🇪' },
    { name: 'Israel', nationality: 'Israeli', flag: '🇮🇱' },
    { name: 'Italy', nationality: 'Italian', flag: '🇮🇹' },
    { name: 'Jamaica', nationality: 'Jamaican', flag: '🇯🇲' },
    { name: 'Japan', nationality: 'Japanese', flag: '🇯🇵' },
    { name: 'Jordan', nationality: 'Jordanian', flag: '🇯🇴' },
    { name: 'Kazakhstan', nationality: 'Kazakh', flag: '🇰🇿' },
    { name: 'Kenya', nationality: 'Kenyan', flag: '🇰🇪' },
    { name: 'Kuwait', nationality: 'Kuwaiti', flag: '🇰🇼' },
    { name: 'Latvia', nationality: 'Latvian', flag: '🇱🇻' },
    { name: 'Lebanon', nationality: 'Lebanese', flag: '🇱🇧' },
    { name: 'Libya', nationality: 'Libyan', flag: '🇱🇾' },
    { name: 'Lithuania', nationality: 'Lithuanian', flag: '🇱🇹' },
    { name: 'Luxembourg', nationality: 'Luxembourgish', flag: '🇱🇺' },
    { name: 'Malaysia', nationality: 'Indonesian', flag: '🇲🇾' },
    { name: 'Mali', nationality: 'Malian', flag: '🇲🇱' },
    { name: 'Malta', nationality: 'Maltese', flag: '🇲🇹' },
    { name: 'Mauritania', nationality: 'Mauritanian', flag: '🇲🇷' },
    { name: 'Mauritius', nationality: 'Mauritian', flag: '🇲🇺' },
    { name: 'Mexico', nationality: 'Mexican', flag: '🇲🇽' },
    { name: 'Monaco', nationality: 'Monacan', flag: '🇲🇨' },
    { name: 'Mongolia', nationality: 'Mongolian', flag: '🇲🇳' },
    { name: 'Morocco', nationality: 'Moroccan', flag: '🇲🇦' },
    { name: 'Mozambique', nationality: 'Mozambican', flag: '🇲🇿' },
    { name: 'Myanmar', nationality: 'Burmese', flag: '🇲🇲' },
    { name: 'Namibia', nationality: 'Namibian', flag: '🇳🇦' },
    { name: 'Nepal', nationality: 'Nepalese', flag: '🇳🇵' },
    { name: 'Netherlands', nationality: 'Dutch', flag: '🇳🇱' },
    { name: 'New Zealand', nationality: 'New Zealander', flag: '🇳🇿' },
    { name: 'Nigeria', nationality: 'Nigerian', flag: '🇳🇬' },
    { name: 'North Korea', nationality: 'North Korean', flag: '🇰🇵' },
    { name: 'Norway', nationality: 'Norwegian', flag: '🇳🇴' },
    { name: 'Oman', nationality: 'Omani', flag: '🇴🇲' },
    { name: 'Pakistan', nationality: 'Pakistani', flag: '🇵🇰' },
    { name: 'Panama', nationality: 'Panamanian', flag: '🇵🇦' },
    { name: 'Paraguay', nationality: 'Paraguayan', flag: '🇵🇾' },
    { name: 'Peru', nationality: 'Peruvian', flag: '🇵🇪' },
    { name: 'Philippines', nationality: 'Filipino', flag: '🇵🇭' },
    { name: 'Poland', nationality: 'Polish', flag: '🇵🇱' },
    { name: 'Portugal', nationality: 'Portuguese', flag: '🇵🇹' },
    { name: 'Qatar', nationality: 'Qatari', flag: '🇶🇦' },
    { name: 'Romania', nationality: 'Romanian', flag: '🇷🇴' },
    { name: 'Russia', nationality: 'Russian', flag: '🇷🇺' },
    { name: 'Rwanda', nationality: 'Rwandan', flag: '🇷🇼' },
    { name: 'Saudi Arabia', nationality: 'Saudi', flag: '🇸🇦' },
    { name: 'Senegal', nationality: 'Senegalese', flag: '🇸🇳' },
    { name: 'Serbia', nationality: 'Serbian', flag: '🇷🇸' },
    { name: 'Singapore', nationality: 'Singaporean', flag: '🇸🇬' },
    { name: 'Slovakia', nationality: 'Slovak', flag: '🇸🇰' },
    { name: 'Slovenia', nationality: 'Slovenian', flag: '🇸🇮' },
    { name: 'Somalia', nationality: 'Somali', flag: '🇸🇴' },
    { name: 'South Africa', nationality: 'South African', flag: '🇿🇦' },
    { name: 'South Korea', nationality: 'South Korean', flag: '🇰🇷' },
    { name: 'Spain', nationality: 'Spanish', flag: '🇪🇸' },
    { name: 'Sri Lanka', nationality: 'Sri Lankan', flag: '🇱🇰' },
    { name: 'Sudan', nationality: 'Sudanese', flag: '🇸🇩' },
    { name: 'Sweden', nationality: 'Swedish', flag: '🇸🇪' },
    { name: 'Switzerland', nationality: 'Swiss', flag: '🇨🇭' },
    { name: 'Syria', nationality: 'Syrian', flag: '🇸🇾' },
    { name: 'Taiwan', nationality: 'Taiwanese', flag: '🇹🇼' },
    { name: 'Tanzania', nationality: 'Tanzanian', flag: '🇹🇿' },
    { name: 'Thailand', nationality: 'Thai', flag: '🇹🇭' },
    { name: 'Tunisia', nationality: 'Tunisian', flag: '🇹🇳' },
    { name: 'Turkey', nationality: 'Turkish', flag: '🇹🇷' },
    { name: 'Uganda', nationality: 'Ugandan', flag: '🇺🇬' },
    { name: 'Ukraine', nationality: 'Ukrainian', flag: '🇺🇦' },
    { name: 'United Arab Emirates', nationality: 'Emirati', flag: '🇦🇪' },
    { name: 'United Kingdom', nationality: 'British', flag: '🇬🇧' },
    { name: 'United States', nationality: 'American', flag: '🇺🇸' },
    { name: 'Uruguay', nationality: 'Uruguayan', flag: '🇺🇾' },
    { name: 'Venezuela', nationality: 'Venezuelan', flag: '🇻🇪' },
    { name: 'Vietnam', nationality: 'Vietnamese', flag: '🇻🇳' },
    { name: 'Yemen', nationality: 'Yemeni', flag: '🇾🇪' },
    { name: 'Zimbabwe', nationality: 'Zimbabwean', flag: '🇿🇼' }
  ];

  // Filter function for nationality search
  filterNationality = (input: string, option: any): boolean => {
    const searchTerm = input.toLowerCase();
    const countryName = option.nzLabel.toLowerCase();
    const nationality = option.nzValue.toLowerCase();
    
    return countryName.includes(searchTerm) || nationality.includes(searchTerm);
  };



  // Custom validator for birth date
  private birthDateValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null; // Let required validator handle empty values
      }

      // Handle both Date objects and string dates
      let selectedDate: Date;
      if (control.value instanceof Date) {
        selectedDate = new Date(control.value);
      } else {
        selectedDate = new Date(control.value);
      }

      // Check if the date is valid
      if (isNaN(selectedDate.getTime())) {
        return {
          invalidDate: {
            valid: false,
            message: 'Please enter a valid date'
          }
        };
      }

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      // Check minimum age (13 years)
      const minDate = new Date(currentDate);
      minDate.setFullYear(currentDate.getFullYear() - 13);

      // Debug logging
      console.log('Birth Date Validation Debug:');
      console.log('Input value:', control.value);
      console.log('Parsed date:', selectedDate);
      console.log('Current date:', currentDate);
      console.log('Min date (13 years ago):', minDate);
      console.log('Is selected date > min date?', selectedDate > minDate);

      // Check if date is in the future
      if (selectedDate > currentDate) {
        return {
          futureDate: {
            valid: false,
            message: 'Birth date cannot be in the future'
          }
        };
      }
      
      // If selected date is after minDate, user is too young
      if (selectedDate > minDate) {
        return {
          minAge: {
            valid: false,
            message: 'You must be at least 13 years old to apply'
          }
        };
      }

      return null; // Date is valid
    };
  }

  disabledDate = (current: Date): boolean => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Maximum date: today (can't select future dates)
    const maxDate = new Date(currentDate);
    
    // Minimum date: 13 years ago (minimum age requirement)
    const minDate = new Date(currentDate);
    minDate.setFullYear(currentDate.getFullYear() - 13);
    
    const selectedDate = new Date(current);
    selectedDate.setHours(0, 0, 0, 0);
    
    // Disable dates that are in the future OR would make someone younger than 13
    // selectedDate > minDate means the person would be younger than 13
    return selectedDate > maxDate || selectedDate > minDate;
  };

  nextTab() {
    if (this.selectedTabIndex < 7) {
      this.selectedTabIndex += 1;
      this.isTabDisabled.fill(true);
      this.isTabDisabled[this.selectedTabIndex] = false;
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
    this.updateTabDisabledStateOptimized();
  }

  handleFileInputChange(l: FileList): void {
    this.file_store = l;
    if (l.length) {
      const f = l[0];
      const count = l.length > 1 ? `(+${l.length - 1} files)` : "";
      this.form.patchValue({
        ActualFile: `${f.name}${count}`,
        profilePicture: f.name
      });
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicture = e.target.result;
      };
      reader.readAsDataURL(f);
    } else {
      this.form.patchValue({
        ActualFile: "",
        profilePicture: ""
      });
      this.profilePicture = "";
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
      selfConfirmedApplicantInformation: [false, [Validators.required]]
    });
    
    this.otherForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.updateTabDisabledStateOptimized();
    });
    
    this.updateTabDisabledStateOptimized();
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
    this.reviewSummaryData = this.collectReviewSummaryData();
    
    const modalRef = this.modal.confirm({
      nzTitle: '<div class="modal-title"><i nz-icon nzType="file-text" nzTheme="outline"></i> Application Review & Confirmation</div>',
      nzContent: this.reviewSummaryService.generateReviewSummaryContent(this.reviewSummaryData),
      nzWidth: 900,
      nzOkText: 'Submit Application',
      nzCancelText: 'Review & Edit',
      nzOkType: 'primary',
      nzOkDanger: false,
      nzClassName: 'review-confirmation-modal',
      nzOkLoading: false,
      nzOnOk: () => {
        this.submitFinalApplication();
        return false;
      },
      nzOnCancel: () => {
        // User chose to review and edit
      }
    });

    this.currentModalRef = modalRef;
  }

  private submitFinalApplication() {
    const postData = this.getApplicantOtherInfo();
    postData.applicantID = this.id;
    
    if (this.currentModalRef) {
      this.currentModalRef.updateConfig({
        nzOkLoading: true,
        nzOkText: 'Submitting...',
        nzOkDisabled: true,
        nzCancelDisabled: true
      });
    }
    
    this.reviewSubmissionLoading = true;
    
    this.generalInformationService.finalSubmit(this.id, postData).subscribe({
      next: (res) => {
        this.reviewSubmissionLoading = false;
        this.isApplicationSubmitted = true;
        
        if (this.currentModalRef) {
          this.currentModalRef.close();
        }
        
        this._customNotificationService.notification(
          "success",
          "Success",
          "Application form submitted successfully!"
        );
        this.router.navigateByUrl(
          `/student-application/admission-request?id=${this.id}`
        );
      },
      error: (error) => {
        this.reviewSubmissionLoading = false;
        
        if (this.currentModalRef) {
          this.currentModalRef.updateConfig({
            nzOkLoading: false,
            nzOkText: 'Submit Application',
            nzOkDisabled: false,
            nzCancelDisabled: false
          });
        }
        
        this._customNotificationService.notification(
          "error",
          "Error",
          "Failed to submit application. Please try again."
        );
      }
    });
  }

  onAgreementFormValidityChange(isValid: boolean) {
    this.agreementFormValid = isValid;
  }

  onAgreementFormValueChange(data: any) {
    this.agreementFormData = data;
  }

  onPaymentStatusChange(status: string) {
    this.paymentStatus = status;
    this.updateTabDisabledStateOptimized();
  }

  onPaymentSuccessful() {
    this.nextTab();
  }

  checkPaymentStatusAndUpdateTabs(): void {
    this.updateTabDisabledStateOptimized();
  }
}
