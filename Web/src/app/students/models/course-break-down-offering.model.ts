export class CourseBreakDownOffering {
  public courseId: string;
  public curriculumCode: string;
  public courseCode: string;
  public courseTitle: string;
  public creditHours: number;
  public id: number;
  public totalAmount: number;
  public isRegistered: boolean;
  public isPaid: boolean;
  public priority: boolean;
  public batchCode: string;
  public previousRAGrade: string;
  public currentGrade: string;
  public courseStatus: string;

   // Equivalent course properties
  public equivalentCourseId: string;
  public equivalentCourseCode: string;
  public equivalentCourseTitle: string;
  public equivalentCreditHours: number;
}
 export class CourseViewModel
 {
     public id: string;
     public courseTitle: string;
     public courseCode: string;

 }