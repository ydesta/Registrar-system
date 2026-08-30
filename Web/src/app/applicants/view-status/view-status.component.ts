import { Component, OnInit } from "@angular/core";
import { CrudService } from "src/app/services/crud.service";

@Component({
  selector: "app-view-status",
  templateUrl: "./view-status.component.html",
  styleUrls: ["./view-status.component.scss"]
})
export class ViewStatusComponent implements OnInit {
  applicant: any;
  constructor(private _crudService: CrudService) {}

  ngOnInit(): void {
    const userId = localStorage.getItem("userId") || localStorage.getItem("user_id");
    if (!userId) {
      return;
    }
    this._crudService
      .getById("/Applicants/ByApplicantUserId", userId)
      .subscribe((res: any) => {
        this.applicant = res.data;
      });
  }
}
