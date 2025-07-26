import { Component, Input, OnInit } from "@angular/core";
import { Course } from "src/app/curricula/models/curriculum-breakdown.model";

@Component({
  selector: "app-course-details",
  templateUrl: "./course-details.component.html",
  styleUrls: ["./course-details.component.scss"]
})
export class CourseDetailsComponent implements OnInit {
  @Input() courses: Course[];
  /**
 *
 */
  constructor() {
    //super();
  }
  ngOnInit(): void {}
  calculateTotalCreditHours(): number {
    return this.courses.reduce(
      (total, course) => total + course.creditHours,
      0
    );
  }
  calculateTotalLectureHours(): number {
    return this.courses.reduce(
      (total, course) => total + course.lectureHours,
      0
    );
  }
  calculateTotalLabHours(): number {
    return this.courses.reduce((total, course) => total + course.labHours, 0);
  }
}
