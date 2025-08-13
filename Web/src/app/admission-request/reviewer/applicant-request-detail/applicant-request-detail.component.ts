import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { GeneralInformationService } from "../../services/general-information.service";
import { SharingDataService } from "../../services/sharing-data.service";
import {
  alphabetsOnlyValidator,
  alphabetsWithSpecialCharsValidator,
  phoneValidator,
  emailValidator,
  ACADEMIC_STUDENT_STATUS_DESCRIPTIONS,
  Division_Status,
  REQUEST_STATUS_DESCRIPTIONS
} from "src/app/common/constant";
import { environment } from "src/environments/environment";
import { ApplicantContactPersonService } from "../../services/applicant-contact-person.service";
import { ApplicantContactPersonRequest } from "../../model/applicant-contact-person-request.model";
import { ApplicantEducationBackgroundRequest } from "../../model/applicant-education-background-request.model";
import { EducationBackgroundService } from "../../services/education-background.service";
import { WorkExperienceService } from "../../services/work-experience.service";
import { ApplicantWorkExperienceRequest } from "../../model/applicant-work-experience-request.model";
import { AcadamicProgramme } from "../../model/acadamic-programme.model";
import { StaticData } from "../../model/StaticData";
import { AcademicProgramRequest } from "../../model/academic-program-request.model";
import { AcademicProgramRequestService } from "../../services/academic-program-request.service";
import { NzTabChangeEvent } from "ng-zorro-antd/tabs";
import { ManageFilesComponent } from "../../file-management/manage-files/manage-files.component";
import { NzModalService } from "ng-zorro-antd/modal";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { take } from "rxjs/operators";
import { ApplicantReviewerDecisionComponent } from "../applicant-reviewer-decision/applicant-reviewer-decision.component";

@Component({
  selector: "app-applicant-request-detail",
  templateUrl: "./applicant-request-detail.component.html",
  styleUrls: ["./applicant-request-detail.component.scss"]
})
export class ApplicantRequestDetailComponent implements OnInit {

  selectedTabIndex = 1;
  form: FormGroup;
  activeTab = 1;
  formData = new FormData();
  profilePicture = "";
  id: string;
  userId: string;
  isTabDisabled: boolean[] = [false, false, false, false, false, false, false, false]; // 8 tabs but only 6 visible for reviewers
  otherForm: FormGroup;
  contactPersonLists: ApplicantContactPersonRequest[] = [];
  educationLists: ApplicantEducationBackgroundRequest[] = [];
  workExperienceLists: ApplicantWorkExperienceRequest[] = [];
  applicationProgramRequestList: AcademicProgramRequest[] = [];
  acadamicProgrammes: AcadamicProgramme[] = [];
  divisionStatusist: StaticData[] = [];
  isUserReviewer: boolean = false;

  constructor(
    private fb: FormBuilder,
    private generalInformationService: GeneralInformationService,
    private router: Router,
    private route: ActivatedRoute,
    private _modal: NzModalService,
    private sharingDataService: SharingDataService,
    private applicantContactPersonService: ApplicantContactPersonService,
    private educationBackgroundService: EducationBackgroundService,
    private workExperienceService: WorkExperienceService,
    private _academicProgramRequestService: AcademicProgramRequestService,
    private _customNotificationService: CustomNotificationService,
  ) {
    this.userId = localStorage.getItem('userId');
    this.checkUserRole();
    this.cretaeGeneralInformationForm();

    this.route.queryParams.pipe(take(1)).subscribe(p => {
      this.id = p["id"];
      if (this.id != undefined && this.id !== null && this.id !== '') {
        this.getApplicantById(this.id);
        this.getApplicantContactPersonByApplicantId(this.id);
        this.getApplicantEducationByApplicantId(this.id);
        this.getApplicantExperienceByApplicantId(this.id);
        this.getApplicantacadamicPrgramtId(this.id);
      }
    });

    this.createAcademicProgramRequest();
  }


  private checkUserRole(): void {
    const role = localStorage.getItem('role');
    const userType = localStorage.getItem('userType');
    if (role) {
      try {
        const roles = JSON.parse(role);
        if (Array.isArray(roles)) {
          this.isUserReviewer = roles.includes('Reviewer');
        } else {
          this.isUserReviewer = role === 'Reviewer';
        }
      } catch {
        this.isUserReviewer = role === 'Reviewer';
      }
    } else {
      // Check userType
      this.isUserReviewer = userType === 'Reviewer';
    }

    if (this.isUserReviewer) {
      this.selectedTabIndex = 1;
      this.isTabDisabled = [true, false, false, false, false, false, false, true];
    } else {
      this.selectedTabIndex = 1;
      this.isTabDisabled = [false, false, false, false, false, false, false, false];
    }
  }

  ngOnInit(): void {
    this.getAcademicProgramList();
    this.getListOfDivisionStatus();
  }
  //#region form Intialization
  cretaeGeneralInformationForm() {
    this.form = this.fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      acadamicProgrammeCode: [""],
      applicantID: [""],
      firstName: ["", [Validators.required, alphabetsOnlyValidator()]],
      fatherName: ["", Validators.required],
      grandFatherName: ["", [Validators.required, alphabetsOnlyValidator()]],
      firstNameInAmh: ["", [Validators.required]],
      fatherNameInAmh: ["", [Validators.required]],
      grandFatherNameInAmh: ["", [Validators.required]],
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
      //vurtual
      telephonOffice: ["", phoneValidator()],
      telephonHome: ["", [phoneValidator()]],
      mobile: ["", [Validators.required, phoneValidator()]],
      postalAddress: [""],
      emailAddress: ["", [Validators.required, emailValidator()]],
      region: ["", [alphabetsOnlyValidator()]],
      city: [""],
      woreda: [""],
      kebele: [""],
      areaType: ["", []],
      nationalExaminationId: ["", [Validators.required]],
      tin: ["", []],
      nationalId: ["", [Validators.required]],
      selfConfirmedApplicantInformation: false,
      dateOfApply: null,
      sourceOfFinance: [""],
      howDidYouComeKnow: [""],
      division: [""],
      ApplicantUserId: [localStorage.getItem("userId")],
      ActualFile: ["", []]
    });
  }

  //#endregion
  createAcademicProgramRequest() {
    this.otherForm = this.fb.group({
      sourceOfFinance: ["", [Validators.required]],
      howDidYouComeKnow: ["", [Validators.required]],
      selfConfirmedApplicantInformation: [null, [Validators.required]],
      dateOfApply: ["", []]
    });
  }
  //#endregion

  //#region get data from the api
  getApplicantById(id: string) {
    this.generalInformationService.getApplicantById(id).subscribe(res => {
      this.form.patchValue(res.data);
      this.otherForm.patchValue(res.data);
      this.profilePicture =
        environment.fileUrl +
        "/Resources/profile/" +
        res.data.files[0]?.fileName;
    });
  }
  getApplicantContactPersonByApplicantId(id: string) {
    this.applicantContactPersonService
      .getApplicantContactPersonId(id)
      .subscribe(res => {
        this.contactPersonLists = res.data;
      });
  }
  getApplicantEducationByApplicantId(id: string) {
    this.educationBackgroundService
      .getApplicantEducationByApplicantId(id)
      .subscribe(res => {
        this.educationLists = res.data;
        this.sharingDataService.otherUpdateMessage(this.educationLists.length);
      });
  }
  getApplicantExperienceByApplicantId(applicantId: string) {
    this.workExperienceService
      .getApplicantExperienceByApplicantId(applicantId)
      .subscribe(res => {
        this.workExperienceLists = res.data;
      });
  }
  getApplicantacadamicPrgramtId(id: string) {
    this._academicProgramRequestService
      .getApplicantacadamicPrgramtId(id)
      .subscribe(res => {
        this.applicationProgramRequestList = res.data;
      });
  }
  //#endregion
  getReguestStatus(status: any) {
    return REQUEST_STATUS_DESCRIPTIONS[status];
  }
  getStudentStatus(status: any) {
    return ACADEMIC_STUDENT_STATUS_DESCRIPTIONS[status];
  }
  setTaxStatusColor(status) {
    switch (status) {
      case 0:
        return "red";
      case 1:
        return "red";
      case 2:
        return "blue";
      case 3:
        return "green";
      default:
        return "black";
    }
  }


  getStatusColor(status: any): string {
    switch (status) {
      case 0:
      case 1:
        return "error";
      case 2:
        return "processing";
      case 3:
        return "success";
      default:
        return "default";
    }
  }

  getAcademicProgramList() {
    this._academicProgramRequestService
      .getAacadamicPrgramtList()
      .subscribe(res => {
        this.acadamicProgrammes = res.data;
      });
  }
  getAcademicProgramDescription(Id: any) {
    const program = this.acadamicProgrammes.find(item => item.id == Id);
    return program ? program.acadamicProgrammeTitle : "";
  }
  getListOfDivisionStatus() {
    let division: StaticData = new StaticData();
    Division_Status.forEach(pair => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description
      };
      this.divisionStatusist.push(division);
    });
  }
  getDivisionStatusDescription(Id: any) {
    const program = this.divisionStatusist.find(item => item.Id == Id);
    return program ? program.Description : "";
  }
  nextTab() {
    const maxTabIndex = this.isUserReviewer ? 6 : 5;
    if (this.selectedTabIndex < maxTabIndex) {
      this.selectedTabIndex += 1;
    }
  }

  previousTab() {
    if (this.selectedTabIndex > 0) {
      this.selectedTabIndex -= 1;
    }
  }
  onSelectChange(event: NzTabChangeEvent): void {
    this.activeTab = event.index + 1;
  }
  viewFile(data: any) {
    this._modal.create({
      nzTitle: "Work Experience",
      nzContent: ManageFilesComponent,
      nzComponentParams: {
        areaId: data.id
      },
      nzMaskClosable: false,
      nzFooter: null,
      nzWidth: "50%"
    });
  }

  openDecisionModal(academicProgramRequest?: AcademicProgramRequest): void {
    const request = academicProgramRequest || this.applicationProgramRequestList[0];
    if (!request) {
      this._customNotificationService.notification(
        "warning",
        "Warning",
        "No academic program request found for this applicant."
      );
      return;
    }

    const modal = this._modal.create({
      nzTitle: "Review Decision",
      nzContent: ApplicantReviewerDecisionComponent,
      nzComponentParams: {
        academicProgramRequest: request,
        applicantId: this.id,
        academicProgramId: request.acadamicProgrammeId
      },
      nzWidth: 600,
      nzMaskClosable: false,
      nzFooter: null
    });

    modal.afterClose.subscribe((result) => {
      if (result) {
        this.getApplicantacadamicPrgramtId(this.id);
        this._customNotificationService.notification(
          "success",
          "Success",
          "Decision submitted successfully."
        );
      }
    });
  }


  get isAcademicProgramValid(): boolean {
    return false;
  }
}
