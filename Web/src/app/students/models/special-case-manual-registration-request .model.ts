import { SelectedCourses } from "./student-course-offering.model";

export interface SpecialCaseManualRegistrationRequest {
  id: string; 
  academicTermId: number;
  year: number;
  batchCode: string;
  createdBy: string;
  selectedCourses: SelectedCourses[]; 
}