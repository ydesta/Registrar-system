import { Component, Input, OnInit } from "@angular/core";
import { CurriculumService } from "../services/curriculum.service";
import { StaticData } from "src/app/admission-request/model/StaticData";
import { CURRICULUM_STATUS } from "src/app/common/constant";

@Component({
  selector: "app-curriculum-status-tracking-list",
  templateUrl: "./curriculum-status-tracking-list.component.html",
  styleUrls: ["./curriculum-status-tracking-list.component.scss"]
})
export class CurriculumStatusTrackingListComponent implements OnInit {
  @Input() curriculumId: string;
  curriculumStatusTrackingLists: any[] = [];
  listOfCurriculumStatus: StaticData[] = [];
  constructor(private _curriculumService: CurriculumService) {}
  ngOnInit(): void {
    this.getListOfCurriculumStatus();
    this.getCurriculumStatusTrackingByCurriculumId(this.curriculumId);
  }
  getCurriculumStatusTrackingByCurriculumId(curriculumId: string) {
    this._curriculumService
      .getCurriculumStatusTrackingByCurriculumId(curriculumId)
      .subscribe(res => {
        this.curriculumStatusTrackingLists = res;
      });
  }
  getListOfCurriculumStatus() {
    let division: StaticData = new StaticData();
    CURRICULUM_STATUS.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfCurriculumStatus.push(division);
    });
  }
  getCurriculumStatusDescription(Id: any) {
    const program = this.listOfCurriculumStatus.find(item => item.Id == Id);
    return program ? program.Description : "";
  }
  setTaxStatusColor(status) {
    let color;
    switch (status) {
      case 1:
        color = "#4CAF50"; // Green
        break;
      case 2:
        color = "#2196F3"; // Blue
        break;
      case 3:
        color = "#FF5733"; // Red
        break;
      default:
        color = "#333"; // Black
    }

    return color;
  }

  cellStyles(status) {
    const color = this.setTaxStatusColor(status);
    const fontSize = 16;

    return {
      color,
      fontSize: `${fontSize}px`
    };
  }
}
