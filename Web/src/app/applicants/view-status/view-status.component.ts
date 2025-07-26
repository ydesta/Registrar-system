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
    this._crudService
      .getList(
        "/Applicants/" +
          "ByApplicantUserId/" +
          localStorage.getItem("userId")
      )
      .subscribe((res: any) => {
        this.applicant = res.data;
        console.log(this.applicant);
      });
  }
}
