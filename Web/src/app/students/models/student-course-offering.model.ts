export class StudentCourseOffering {
  public termCourseOfferingId: string;
  public studentId: string;
  public academicTermCode: string;
  public isAproved: boolean;
  public registrationStatus: number;
  public selectedCourses: SelectedCourses[];
}
export class SelectedCourses {
  public courseId: string;
  public priority: number;
  public registrationStatus: number;
  public totalAmount: number;
  public batchCode: string;
}