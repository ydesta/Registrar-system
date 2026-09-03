import { Component, Input, OnInit } from "@angular/core";
import { NzModalRef } from "ng-zorro-antd/modal";
import { CurriculumService } from "../services/curriculum.service";
import { StaticData } from "src/app/admission-request/model/StaticData";
import { CURRICULUM_STATUS } from "src/app/common/constant";
import { CustomNotificationService } from "src/app/services/custom-notification.service";

@Component({
  selector: "app-curriculum-status-tracking-list",
  templateUrl: "./curriculum-status-tracking-list.component.html",
  styleUrls: ["./curriculum-status-tracking-list.component.scss"]
})
export class CurriculumStatusTrackingListComponent implements OnInit {
  @Input() curriculumId: string;
  curriculumStatusTrackingLists: any[] = [];
  listOfCurriculumStatus: StaticData[] = [];
  loading = false;

  constructor(
    private _curriculumService: CurriculumService,
    private modalRef: NzModalRef,
    private _notification: CustomNotificationService
  ) {
    const params = this.modalRef.getConfig().nzComponentParams;
    if (params?.["curriculumId"]) {
      this.curriculumId = params["curriculumId"];
    }
  }

  ngOnInit(): void {
    this.getListOfCurriculumStatus();
    if (!this.curriculumId) {
      this._notification.notification(
        "error",
        "Error",
        "Curriculum id is missing for status tracking."
      );
      return;
    }
    this.getCurriculumStatusTrackingByCurriculumId(this.curriculumId);
  }

  getCurriculumStatusTrackingByCurriculumId(curriculumId: string) {
    this.loading = true;
    this._curriculumService
      .getCurriculumStatusTrackingByCurriculumId(curriculumId)
      .subscribe({
        next: (res: any) => {
          this.curriculumStatusTrackingLists = Array.isArray(res)
            ? res
            : res?.data ?? [];
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.curriculumStatusTrackingLists = [];
          this._notification.notification(
            "error",
            "Error",
            "Failed to load curriculum status tracking."
          );
        }
      });
  }

  getListOfCurriculumStatus() {
    this.listOfCurriculumStatus = CURRICULUM_STATUS.map(pair => ({
      Id: pair.Id,
      Description: pair.Description
    }));
  }

  getCurriculumStatusDescription(Id: any) {
    if (Id === null || Id === undefined || Id === "" || Id === 0) {
      return "";
    }
    const program = this.listOfCurriculumStatus.find(item => item.Id == Id);
    return program ? program.Description : "";
  }

  statusClass(status: any): string {
    switch (Number(status)) {
      case 1:
        return "status-active";
      case 2:
        return "status-phasing";
      case 3:
        return "status-retired";
      default:
        return "status-empty";
    }
  }
}
