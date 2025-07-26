import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NzModalRef } from "ng-zorro-antd/modal";
import { EducationBackgroundService } from "../../services/education-background.service";
import { AcademicProgramRequest } from "../../model/academic-program-request.model";
import { AcademicProgramRequestService } from "../../services/academic-program-request.service";
import { AcadamicProgramme } from "../../model/acadamic-programme.model";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { StaticData } from "../../model/StaticData";
import { Division_Status } from "src/app/common/constant";

@Component({
  selector: "app-student-program-requester-form",
  templateUrl: "./student-program-requester-form.component.html",
  styleUrls: ["./student-program-requester-form.component.scss"]
})
export class StudentProgramRequesterFormComponent implements OnInit {
  /**
   *
   */
  @Input() applicantId: string;
  @Output() dataUpdated = new EventEmitter<void>();
  @Input() studentProgramRequester: AcademicProgramRequest;
  academicProgramRequestForm: FormGroup;
  acadamicProgrammes: AcadamicProgramme[] = [];
  divisionStatusist: StaticData[] = [];
  id: number;
  constructor(
    private modalRef: NzModalRef,
    private _fb: FormBuilder,
    private _academicProgramRequestService: AcademicProgramRequestService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.createAcademicProgramRequest();
  }
  ngOnInit(): void {
    this.getAcademicProgramList();
    this.getListOfDivisionStatus();
    if (this.studentProgramRequester != undefined) {
      this.id = this.studentProgramRequester.id;
      this.academicProgramRequestForm.patchValue(this.studentProgramRequester);
    }
  }

  createAcademicProgramRequest() {
    this.academicProgramRequestForm = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      division: ["", [Validators.required]],
      acadamicProgrammeId: ["", [Validators.required]]
    });
  }

  private getAcademicProgramRequest(): AcademicProgramRequest {
    const formModel = this.academicProgramRequestForm.getRawValue();
    const request = new AcademicProgramRequest();
    request.applicantId = this.applicantId;
    request.createdBy = "";
    request.acadamicProgrammeId = formModel.acadamicProgrammeId;
    request.division = formModel.division;
    request.studentStatus = 0;
    request.approvalStatus = 0;
    return request;
  }
  get acadamicProgrammeId() {
    return this.academicProgramRequestForm.get("acadamicProgrammeId");
  }
  get division() {
    return this.academicProgramRequestForm.get("division");
  }

  getAcademicProgramList() {
    this._academicProgramRequestService
      .getAacadamicPrgramtList()
      .subscribe(res => {
        this.acadamicProgrammes = res.data;
      });
  }
  onSubmit() {
    const postData = this.getAcademicProgramRequest();
    if (this.id == undefined) {
      this._academicProgramRequestService.create(postData).subscribe(res => {
        if (res != null) {
          this._customNotificationService.notification(
            "success",
            "Success",
            "Academic Program Request  is save succesfully."
          );
          // Emit the event when data is successfully saved
          this.dataUpdated.emit();
          // Close the modal here if needed
          this.modalRef.close();
        } else {
          this._customNotificationService.notification(
            "warn",
            "Warn",
            "Academic Program Request does not depulicate."
          );
        }
      });
    } else {
      postData.id = this.id;
      postData.applicantId = this.studentProgramRequester.applicantId;
      this._academicProgramRequestService
        .update(this.id, postData)
        .subscribe(res => {
          if (res != null) {
            this._customNotificationService.notification(
              "success",
              "Success",
              "Academic Program Request  is update succesfully."
            );
            // Emit the event when data is successfully saved
            this.dataUpdated.emit();
            // Close the modal here if needed
            this.modalRef.close();
          } else {
            this._customNotificationService.notification(
              "warn",
              "Warn",
              "Academic Program Request does not depulicate."
            );
          }
        });
    }
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
}
