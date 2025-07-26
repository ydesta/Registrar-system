import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NzModalRef } from "ng-zorro-antd/modal";
import { REGISTARAR_APPROVAL_STATUS } from "src/app/common/constant";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { RegistrarWorkFlow } from "../../models/registrar-work-flow.model";
import { StaticData } from "src/app/admission-request/model/StaticData";

@Component({
  selector: "app-work-flow-form",
  templateUrl: "./work-flow-form.component.html",
  styleUrls: ["./work-flow-form.component.scss"]
})
export class WorkFlowFormComponent implements OnInit {
  @Input() termCourseOfferingId: string;
  @Input() fullName: string;
  @Input() status: number;
  workflowForm: FormGroup;
  listOfApprovalStatus: StaticData[] = [];
  contactId: string;

  constructor(
    private modalRef: NzModalRef,
    private _fb: FormBuilder,
    private _customNotificationService: CustomNotificationService
  ) {}
  ngOnInit(): void {
    var x = localStorage.getItem("firstName");
    var x1 = localStorage.getItem("lastName");
    this.getListOfApprovalStatus();
    this.createWorkflow();
  }

  createWorkflow() {
    this.workflowForm = this._fb.group({
      fullName: [this.fullName, []],
      previousStatus: [this.status, []],
      currentStatus: ["", []],
      description: ["", []]
    });
  }
  private getRegistrarWorkFlow(): RegistrarWorkFlow {
    const formModel = this.workflowForm.getRawValue();
    const workFlow = new RegistrarWorkFlow();
    workFlow.parentId = this.termCourseOfferingId;
    workFlow.actionBy = formModel.fullName;
    workFlow.currentStatus = formModel.currentStatus;
    workFlow.previousStatus = formModel.previousStatus;
    workFlow.description = formModel.description;
    return workFlow;
  }
  getListOfApprovalStatus() {
    let division: StaticData = new StaticData();
    REGISTARAR_APPROVAL_STATUS.forEach(pair => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description
      };
      this.listOfApprovalStatus.push(division);
    });
  }
  onSubmit() {
    const postData = this.getRegistrarWorkFlow();
  }
}
