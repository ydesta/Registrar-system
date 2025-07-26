import { Component, Input } from "@angular/core";

@Component({
  selector: "app-decision-dropdown",
  templateUrl: "./decision-dropdown.component.html",
  styleUrls: ["./decision-dropdown.component.scss"]
})
export class DecisionDropdownComponent {
  @Input() courseId: string;

  // Add your Accept and Reject action handling logic here
  acceptCourse(courseId: string) {
    // Handle the Accept action for the specified course
  }

  rejectCourse(courseId: string) {
    // Handle the Reject action for the specified course
  }
}
