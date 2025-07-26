import { Component, OnInit } from "@angular/core";
import {
  ACADEMIC_STUDENT_STATUS_DESCRIPTIONS,
  REQUEST_STATUS_DESCRIPTIONS
} from "src/app/common/constant";

@Component({
  selector: "app-academic-program-request",
  templateUrl: "./academic-program-request.component.html",
  styleUrls: ["./academic-program-request.component.scss"]
})
export class AcademicProgramRequestComponent implements OnInit {
  /**
   *
   */
  constructor() {}
  ngOnInit(): void {}

  createAcademicProgram() {}

  getReguestStatus(status: any) {
    return REQUEST_STATUS_DESCRIPTIONS[status];
  }
  getStudentStatus(status: any) {
    return ACADEMIC_STUDENT_STATUS_DESCRIPTIONS[status];
  }
}
