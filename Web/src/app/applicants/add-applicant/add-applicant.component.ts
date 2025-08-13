import { Component, OnInit, QueryList, ViewChildren } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { NzModalService } from "ng-zorro-antd/modal";
import { EducationModel } from "src/app/Models/ApplicantEducationModel";
import { FileModel } from "src/app/Models/FileModel";
import { CrudService } from "src/app/services/crud.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { FilesService } from "src/app/services/files.service";
import { environment } from "src/environments/environment";
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from "ng-zorro-antd/collapse";

@Component({
  selector: "app-add-applicant",
  templateUrl: "./add-applicant.component.html",
  styleUrls: ["./add-applicant.component.scss"]
})
export class AddApplicantComponent implements OnInit {
  @ViewChildren(NzCollapsePanelComponent)
  collapsePanels: QueryList<NzCollapsePanelComponent>;

  activePanelIndex: number = 0;

  profilePath = "";
  action = "Applicant Form";
  applicantForm: FormGroup;
  applicantContactPersonForm: FormGroup;
  applicantAddressForm: FormGroup;
  applicantEducationBacgroundForm: FormGroup;
  applicantWorkExpForm: FormGroup;
  otherForm: FormGroup;
  programmeForm: FormGroup;
  courses: any;
  students: any;
  bankTransactions: any;
  acadamicProgrammes: any;
  progStatusId: any;
  submit = "Register";
  filInfo: FileModel = {
    fileName: "",
    fileType: "",
    category: "",
    areaID: "",
    createdBy: "",
    lastModifiedBy: ""
  };
  filInfos: FileModel[] = [];
  educationLists: EducationModel[] = [];
  steps = 0;
  educationIndex = -1;
  educationModalVisible = false;
  selfConfirmedApplicantInformation = false;
  dateOfApply: any = new Date();
  haveWorkExperience = false;
  educationFile = "";
  workExpeFile = "";
  constructor(
    private _modal: NzModalService,
    private _file: FilesService,
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.applicantForm = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      acadamicProgrammeCode: [""],
      applicantID: [""],
      firstName: ["", Validators.required],
      fatherName: ["", Validators.required],
      grandFatherName: ["", Validators.required],
      sirName: [""],
      motherName: ["", Validators.required],
      gender: ["", Validators.required],
      birthDate: [null, Validators.required],
      birthPlace: ["", Validators.required],
      nationality: ["", Validators.required],
      //vurtual
      telephonOffice: [""],
      telephonHome: [""],
      mobile: [""],
      postalAddress: [""],
      emailAddress: [""],
      region: [""],
      city: [""],
      woreda: [""],
      kebele: [""],
      selfConfirmedApplicantInformation: false,
      dateOfApply: null,
      sourceOfFinance: [""],
      howDidYouComeKnow: [""],
      division: [""],
      ApplicantUserId: [localStorage.getItem("userId")]
    });
    this.applicantAddressForm = this._fb.group({
      telephonOffice: [""],
      telephonHome: [""],
      mobile: ["", Validators.required],
      postalAddress: [""],
      emailAddress: ["", Validators.required],
      region: ["", Validators.required],
      city: ["", Validators.required],
      woreda: ["", Validators.required],
      kebele: ["", Validators.required]
    });
    this.applicantContactPersonForm = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      applicantID: [""],
      fullName: ["", Validators.required],
      telephoneOffice: ["", Validators.required],
      telephoneHome: [""],
      relation: ["", Validators.required]
    });
    this.applicantEducationBacgroundForm = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      applicantID: [""],
      schoollName: ["", Validators.required],
      fieldOfStudy: ["", Validators.required],
      programmeLevel: ["", Validators.required],
      graduatedYear: ["", Validators.required],
      remark: [""],
      attachFile: [""]
    });
    this.applicantWorkExpForm = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      applicantID: [""],
      companyName: ["", Validators.required],
      totalWorkYear: [0, Validators.required],
      post: [""]
    });
    this.otherForm = this._fb.group({
      sourceOfFinance: ["", Validators.required],
      howDidYouComeKnow: ["", Validators.required]
    });
    this.programmeForm = this._fb.group({
      acadamicProgrammeCode: ["", Validators.required],
      division: ["", Validators.required]
    });
    this._modal.afterAllClose.subscribe(() => {
      this.educationIndex = -1;
    });
  }
  passSteps() {
    if (this.filInfos.length > 0) {
      this.filInfos.forEach(_element => {
        if (_element.category == "Profile") {
          this.steps = 1;
        }
      });
    } else {
      if (this.steps == 1) {
        this.steps = 0;
      }
    }

    if (this.applicantForm.valid && this.steps == 1) {
      this.steps = 2;
    } else {
      if (this.steps == 2) {
        this.steps = 1;
      }
    }
    if (this.applicantAddressForm.valid && this.steps == 2) {
      this.steps = 3;
    } else {
      if (this.steps == 3) {
        this.steps = 2;
      }
    }
    if (this.applicantWorkExpForm.valid && this.steps == 3) {
      this.steps = 4;
    } else {
      if (this.steps == 4) {
        this.steps = 3;
      }
    }
    if (this.educationLists.length > 0 && this.steps == 4) {
      this.steps = 5;
    } else {
      if (this.steps == 5) {
        this.steps = 4;
      }
    }
    if (this.applicantContactPersonForm.valid && this.steps == 5) {
      this.steps = 6;
    } else {
      if (this.steps == 6) {
        this.steps = 5;
      }
    }

    if (this.programmeForm.valid && this.steps == 6) {
      this.steps = 7;
    } else {
      if (this.steps == 7) {
        this.steps = 6;
      }
    }
    if (this.otherForm.valid && this.steps == 7) {
      this.steps = 8;
    } else {
      if (this.steps == 8) {
        this.steps = 7;
      }
    }
    if (this.selfConfirmedApplicantInformation && this.steps == 8) {
      this.steps = 9;
    } else {
      if (this.steps == 9) {
        this.steps = 8;
      }
    }
    if (this.steps < 0) {
      this.steps = 0;
    }
  }

  ngOnInit(): void {
    this.progStatusId = this.aciveRoute.snapshot.paramMap.get("id");
    if (this.progStatusId != "new") {
      this.action = "Edit Applicant";
      this.submit = "Update";
      this._crudService
        .getList("/Applicants" + "/" + this.progStatusId)
        .subscribe((res: any) => {
          this.patchValues(res.data);
        });
    }
    this._crudService.getList("/AcadamicProgramme").subscribe((res: any) => {
      this.acadamicProgrammes = res.data;
    });
    this._crudService.getList("/BankTransactions").subscribe((res: any) => {
      this.bankTransactions = res.data;
    });
    this._crudService.getList("/courses").subscribe((res: any) => {
      this.courses = res.data;
    });
    this._crudService.getList("/Students").subscribe((res: any) => {
      this.students = res.data;
    });
  }

  submitForm() {
    this.applicantForm.value.city = this.applicantAddressForm.value.city;
    this.applicantForm.value.emailAddress = this.applicantAddressForm.value.emailAddress;
    this.applicantForm.value.kebele = this.applicantAddressForm.value.kebele;
    this.applicantForm.value.mobile = this.applicantAddressForm.value.mobile;
    this.applicantForm.value.postalAddress = this.applicantAddressForm.value.postalAddress;
    this.applicantForm.value.region = this.applicantAddressForm.value.region;
    this.applicantForm.value.selfConfirmedApplicantInformation = this.selfConfirmedApplicantInformation;
    this.applicantForm.value.dateOfApply = this.dateOfApply;
    this.applicantForm.value.telephonHome = this.applicantAddressForm.value.telephonHome;
    this.applicantForm.value.telephonOffice = this.applicantAddressForm.value.telephonOffice;
    this.applicantForm.value.woreda = this.applicantAddressForm.value.woreda;
    this.applicantForm.value.howDidYouComeKnow = this.otherForm.value.howDidYouComeKnow;
    this.applicantForm.value.sourceOfFinance = this.otherForm.value.sourceOfFinance;
    this.applicantForm.value.acadamicProgrammeCode = this.programmeForm.value.acadamicProgrammeCode;
    this.applicantForm.value.division = this.programmeForm.value.division;
    this.applicantForm.value.ApplicantUserId = localStorage.getItem(
      "userId"
    );
    if (this.applicantForm.valid) {
      if (this.progStatusId == "new") {
        this._crudService
          .add("/Applicants", this.applicantForm.value)
          .subscribe((res: any) => {
            this._customNotificationService.notification(
              "success",
              "Success",
              "You are registered successfully."
            );
            this.registerRelateddata(res.data.applicantID, res.data.id);
            this._route.navigateByUrl("dashboard");
          });
      } else if (this.progStatusId != "new") {
        if (this.applicantForm.valid) {
          this._crudService
            .update("/Applicants", this.progStatusId, this.applicantForm.value)
            .subscribe((res: any) => {
              if (res.status == "success") {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  res.data
                );
                this._route.navigateByUrl("applicants");
              } else {
                this._customNotificationService.notification(
                  "error",
                  "Error",
                  res.data
                );
              }
            });
        }
      }
    } else {
      this._customNotificationService.notification(
        "error",
        "error",
        "Enter valid data."
      );
    }
  }
  registerRelateddata(id: any, systemId: any) {
    for (let count = 0; count < this.filInfos.length; count++) {
      this.filInfos[count].areaID = systemId;
    }
    this._crudService
      .add("/Files/save", this.filInfos)
      .subscribe((res: any) => {});
    if (this.applicantWorkExpForm.valid && this.haveWorkExperience) {
      this.applicantWorkExpForm.value.applicantID = id;
      this._crudService
        .add("/ApplicantWorkExperiences", this.applicantWorkExpForm.value)
        .subscribe((res: any) => {});
    }
    this.applicantContactPersonForm.value.applicantID = id;
    this._crudService
      .add("/ApplicantContactPersons", this.applicantContactPersonForm.value)
      .subscribe((res: any) => {});
    this.educationLists.forEach(_element => {
      _element.applicantID = id;
      _element.graduatedYear = _element.graduatedYear.toString();
      this._crudService
        .add("/ApplicantEducationBackgrounds", _element)
        .subscribe((res: any) => {});
    });
  }
  patchValues(data: any) {
    this.applicantForm.patchValue({
      applicantID: data.applicantID,
      photo: data.photo,
      firstName: data.firstName,
      fatherName: data.fatherName,
      grandFatherName: data.grandFatherName,
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
      acadamicProgrammeCode: data.acadamicProgrammeCode
    });
  }

  public uploadFile = (event: any, category: string) => {
    this._file.uploadFile(event, category).subscribe((res: any) => {
      if (res.status == "succes") {
        if (res.data.category == "Profile") {
          this.profilePath =
            environment.fileUrl + "/Resources/Files/" + res.data.data.fileName;
        }
        if (this.filInfo.category == "Education Attachment") {
          this.educationFile = res.data.data.fileName;
        }
        if (this.filInfo.category == "Work Experience Attachment") {
          this.workExpeFile = res.data.data.fileName;
        }
        this.filInfo.fileName = res.data.fileName;
        this.filInfo.fileType = res.data.contentType;
        this.filInfo.category = category;
        this.filInfos = [this.filInfo, ...this.filInfos];
        this.passSteps();
      } else {
        this._customNotificationService.notification(
          "error",
          "Error",
          "File is not uploaded. Try again."
        );
      }
    });
  };
  educationHandleCancel() {
    this.educationModalVisible = false;
    this.educationIndex = -1;
    this.applicantEducationBacgroundForm.reset();
  }
  educationHandleOk() {
    if (this.applicantEducationBacgroundForm.valid) {
      if (this.educationIndex > -1) {
        this.educationLists[
          this.educationIndex
        ] = this.applicantEducationBacgroundForm.value;
        this.educationLists = [...this.educationLists];
        this.educationFile = "";
        this._customNotificationService.notification(
          "success",
          "Success",
          "Education Record is updated succesfully."
        );
      } else {
        this.educationLists = [
          ...this.educationLists,
          this.applicantEducationBacgroundForm.value
        ];
        this._customNotificationService.notification(
          "success",
          "Success",
          "Education Record is added succesfully."
        );
      }

      this.educationModalVisible = false;
      this.applicantEducationBacgroundForm.reset();
      this.educationIndex = -1;
      this.passSteps();
    } else {
      this._customNotificationService.notification(
        "error",
        "Error",
        "Enter valid data."
      );
    }
  }
  showAddEducationModal() {
    this.educationModalVisible = true;
  }
  deleteEducation(index: number) {
    this.educationIndex = index;
    this._modal.confirm({
      nzTitle: "Are you sure delete this Education Record?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        try {
          let listCount = this.educationLists.length;
          this.educationLists = [
            ...this.educationLists.splice(this.educationIndex - 1, 1)
          ];
          this._customNotificationService.notification(
            "success",
            "Success",
            "Education Record is deleted succesfully."
          );
          this.educationIndex = -1;
          if (listCount == 1) {
            this.educationLists = [];
          }
        } catch (error) {
          this._customNotificationService.notification(
            "error",
            "Error",
            "Try again."
          );
        }
      },
      nzCancelText: "No",
      nzOnCancel: () => {}
    });
  }
  editEducation(index: number) {
    this.educationIndex = index;
    this.patchEducationValue(this.educationLists[this.educationIndex]);
    this.educationModalVisible = true;
  }
  patchEducationValue(data: any) {
    this.applicantEducationBacgroundForm.patchValue({
      schoollName: data.schoollName,
      fieldOfStudy: data.fieldOfStudy,
      programmeLevel: data.programmeLevel,
      graduatedYear: data.graduatedYear,
      remark: data.remark,
      attachFile: data.attachFile
    });
    this.educationFile = data.attachFile.split("\\")[
      data.attachFile.split("\\").length - 1
    ];
  }
  haveWorkExpe() {
    this.haveWorkExperience = !this.haveWorkExperience;
  }
  // Function to move to the next panel
  nextPanel() {
    if (this.activePanelIndex < this.collapsePanels.length - 1) {
      this.activePanelIndex++;
      this.collapsePanels.toArray()[this.activePanelIndex].nzActive = true;
    }
  }

  // Function to move to the previous panel
  prevPanel() {
    if (this.activePanelIndex > 0) {
      this.activePanelIndex--;
      this.collapsePanels.toArray()[this.activePanelIndex].nzActive = true;
    }
  }
}
