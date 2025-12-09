export interface StudentRegisteredCoursesModel {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  numberOfStudents: number;
  numberOfSections: number;
  maxStudentsPerSection: number;
  isDefaultSection: boolean;
  batchCode?: string;
  registrationStatus?: string;
}
export interface StudentRegisteredCoursesResult {
  totalDistinctCount: number;
  numberOfGeneratedSections: number;
  isSectionGenerated: boolean;
  courses: StudentRegisteredCoursesModel[];
}
export class CourseInfo
{
    public courseId :string;
    public courseCode: string;
    public courseTitle:string;
    public batchCode: string;
    public registrationStatus: string;
}