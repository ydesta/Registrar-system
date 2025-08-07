export interface SpecialCaseManualRegistrationRequest {
  id: string; 
  academicTermId: number;
  year: number;
  batchCode: string;
  createdBy: string;
  selectedCourses: SelectedCourses[]; 
}

export class SelectedCourses {
  public courseId: string;
  public priority: number;
  public registrationStatus: number;
  public totalAmount: number;
  public batchCode: string;
} 