import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from "@angular/forms";
import { NzTabChangeEvent } from "ng-zorro-antd/tabs";
import { NzModalService } from "ng-zorro-antd/modal";
import {
  alphabetsOnlyValidator,
  alphabetsWithSpecialCharsValidator,
  emailValidator,
  flexibleNameValidator,
  englishOnlyValidator,
  phoneValidator9To14,
  COUNTRIES
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
export class GeneralInformationComponent implements OnInit, OnDestroy {
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
  paymentPolicyAccepted: boolean = false;
  @ViewChild(SchoolWithStudentAgreementComponent)
  schoolAgreementComp: SchoolWithStudentAgreementComponent;
  currentModalRef: any;

  // Add flag to prevent recursive calls
  private isHandlingApplicantError = false;
  private hasAttemptedApplicantFetch = false;
// Countries list with flags and nationalities
  countries = COUNTRIES;
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

    if (this.id == undefined && this.userId != null && !this.hasAttemptedApplicantFetch) {
      const userId = localStorage.getItem('userId');
      this.hasAttemptedApplicantFetch = true;
      this.generalInformationService.getOrStoreParentApplicantId(userId).subscribe({
        next: (applicantId) => {
          if (!applicantId) {
            this._customNotificationService.notification(
              "warning",
              "No Application Found",
              "We couldn't find any application data for you. Please create a new application."
            );
            return; // stop further execution
          }

          this.id = applicantId;
          this.getApplicantById(applicantId);
        },
        error: (error) => {
          let errorMessage = 'Unable to load your application data. ';
          if (error.message?.includes('404')) {
            errorMessage += 'The application service is not available. Please try again later.';
          } else if (error.message?.includes('Network error')) {
            errorMessage += 'Please check your internet connection and try again.';
          } else if (error.message?.includes('Server error')) {
            errorMessage += 'The server is experiencing issues. Please try again later.';
          } else {
            errorMessage += 'Please refresh the page or try again later.';
          }

          this._customNotificationService.notification(
            "error",
            "Application Loading Error",
            errorMessage
          );
        }
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
      firstNameInAmh: ["", [flexibleNameValidator()]],
      fatherNameInAmh: ["", [flexibleNameValidator()]],
      grandFatherNameInAmh: ["", [flexibleNameValidator()]],
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
      telephonOffice: ["", [phoneValidator9To14()]],
      telephonHome: ["", [phoneValidator9To14()]],
      mobile: ["", [Validators.required, phoneValidator9To14()]],
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
        return !this.paymentPolicyAccepted;
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

    // Check if we're on the last tab (Agreement tab)
    if (this.selectedTabIndex !== 7) {
      return true;
    }

    // Check if agreement form is valid
    if (!this.agreementFormValid) {
      return true;
    }

    // Check if required counts are greater than zero
    if (this.countNoOfContact <= 0) {
      return true;
    }

    if (this.countNoOfEducation <= 0) {
      return true;
    }

    if (this.countSubmitionCourse <= 0) {
      return true;
    }

    return false;
  }

  get isAcademicProgramProcessed(): boolean {
    return this.isSubmittedApplicationForm === 1;
  }

  // Debug method to check validation status
  get submitButtonValidationStatus(): any {
    return {
      isApplicationSubmitted: this.isApplicationSubmitted,
      isSubmittedApplicationForm: this.isSubmittedApplicationForm,
      selectedTabIndex: this.selectedTabIndex,
      agreementFormValid: this.agreementFormValid,
      countNoOfContact: this.countNoOfContact,
      countNoOfEducation: this.countNoOfEducation,
      countSubmitionCourse: this.countSubmitionCourse,
      isSubmitButtonDisabled: this.isSubmitButtonDisabled
    };
  }

  get isSaveButtonDisabled(): boolean {
    // Keep save button enabled after submission - only disable Review button
    return false;
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
  get city() {
    return this.form.get("city");
  }
  get woreda() {
    return this.form.get("woreda");
  }
  get kebele() {
    return this.form.get("kebele");
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
    if (this.isHandlingApplicantError) {
      return;
    }
    this.generalInformationService.getApplicantById(id).subscribe({
      next: (res) => {
        const applicantData = this.extractResponseData<any>(res);
        if (!applicantData) {
          this._customNotificationService.notification(
            "error",
            "Data Error",
            "Invalid data received from server. Please try again."
          );
          return;
        }
        const formData = { ...applicantData };
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
          sourceOfFinance: applicantData.sourceOfFinance || applicantData.sourceOfFinanceId || applicantData.financeSource || '',
          howDidYouComeKnow: applicantData.howDidYouComeKnow || applicantData.howDidYouComeKnowId || applicantData.referralSource || '',
          selfConfirmedApplicantInformation: applicantData.selfConfirmedApplicantInformation === true ||
            applicantData.selfConfirmedApplicantInformation === 'true' ||
            applicantData.selfConfirmedApplicantInformation === 1 ||
            false
        };

        this.otherForm.patchValue(academicProgramData);
        this.otherForm.markAsTouched();

        this.profilePicture =
          environment.fileUrl +
          "/Resources/profile/" +
          (applicantData.files?.[0]?.fileName || '');

        if (applicantData.files && applicantData.files.length > 0 && applicantData.files[0]?.fileName) {
          this.form.patchValue({
            profilePicture: applicantData.files[0].fileName
          });
        }

        // If existing data is loaded, payment policy is considered accepted
        this.paymentPolicyAccepted = true;

        this.updateTabDisabledStateOptimized();

        setTimeout(() => {
          if (this.schoolAgreementComp && applicantData) {
            this.schoolAgreementComp.agreementForm.patchValue({
              sourceOfFinance: applicantData.sourceOfFinance,
              howDidYouComeKnow: applicantData.howDidYouComeKnow,
              selfConfirmedApplicantInformation: applicantData.selfConfirmedApplicantInformation
            });
          }
        });

        console.log('Applicant data successfully loaded and form updated');
      },
      error: (error) => {
        console.error('Error fetching applicant data:', error);

        // Prevent recursive calls
        if (this.isHandlingApplicantError) {
          console.log('Already handling applicant error, skipping recursive call');
          return;
        }

        this.isHandlingApplicantError = true;

        let errorMessage = 'Unable to load your application data. ';

        if (error.status === 404) {
          errorMessage += 'Application not found. Please check your login or contact support.';
        } else if (error.status === 0) {
          errorMessage += 'Network error. Please check your internet connection.';
        } else if (error.status >= 500) {
          errorMessage += 'Server error. Please try again later.';
        } else {
          errorMessage += 'Please refresh the page or try again later.';
        }

        // this._customNotificationService.notification(
        //   "error",
        //   "Application Loading Error",
        //   errorMessage
        // );

        // Redirect to login if we can't load the application
        setTimeout(() => {
          console.log('Redirecting to login due to applicant data fetch failure');
          this.router.navigate(['/accounts/login']);
        }, 3000);
      }
    });
  }

  submitForm() {
    this.validateAllFormFields(this.form);
    setTimeout(() => {
      this.form.updateValueAndValidity();
      if (!this.form.valid) {
        this._customNotificationService.notification(
          "warn",
          "Validation Error",
          "Please fix the validation errors before saving."
        );
        return;
      }
      this.continueFormSubmission();
    }, 100);
  }

  private continueFormSubmission(): void {
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

    if (this.id == undefined) {
      this.generalInformationService
        .createGeneralInformation(formData)
        .subscribe({
          next: (res) => {
            this.saveLoading = false;
            const responseData = this.extractResponseData<any>(res);
            if (responseData != null && responseData.id) {
              this._customNotificationService.notification(
                "success",
                "Success",
                "Admission request is saved successfully."
              );
              this.id = responseData.id;
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
            const responseData = this.extractResponseData<any>(res);
            if (responseData != null) {
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
        control.markAsTouched(); // Mark as touched to show validation errors
      }
    });
  }

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
    this.selectedTabIndex = event.index;
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
      nzOkText: 'Submit',
      nzCancelText: 'Review & Edit',
      nzOkType: 'primary',
      nzOkDanger: false,
      nzClassName: 'review-confirmation-modal',
      nzOkLoading: false,
      nzStyle: { top: '5%' },
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
    console.log("$$      ", postData);
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
          "Your application has been submitted successfully!"
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

  onPaymentPolicyAccepted(accepted: boolean) {
    this.paymentPolicyAccepted = accepted;
  }

  onPaymentSuccessful() {
    // This method is no longer used since we removed the paymentSuccessful event
    // The application-fee component now handles successful payments internally
    // without navigating to the next tab, following the ManageEducationComponent pattern
    console.log('Payment successful - staying on current tab');
  }

  checkPaymentStatusAndUpdateTabs(): void {
    this.updateTabDisabledStateOptimized();
  }

  // Add method to reset error flags
  private resetErrorFlags() {
    this.isHandlingApplicantError = false;
    this.hasAttemptedApplicantFetch = false;
  }

  // Add cleanup method
  ngOnDestroy() {
    this.resetErrorFlags();
  }

  // Add retry method for manual retry
  retryApplicantFetch() {
    console.log('Manual retry requested for applicant fetch');
    this.resetErrorFlags();

    if (this.userId) {
      this.ngOnInit();
    } else {
      console.log('No userId available for retry');
      this.router.navigate(['/accounts/login']);
    }
  }

  // Helper method to extract data from different response structures
  // This handles both ApiResponse<T> format (with data wrapper) and direct object format
  private extractResponseData<T>(res: any): T | null {
    if (res && typeof res === 'object') {
      // Check if response has data property (ApiResponse<T> structure)
      if ('data' in res && res.data) {
        return res.data;
      }
      // Check if response is the data directly
      else if ('id' in res) {
        return res;
      }
    }
    return null;
  }
}
