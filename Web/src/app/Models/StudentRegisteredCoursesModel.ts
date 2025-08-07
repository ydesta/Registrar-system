export interface StudentRegisteredCoursesModel {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  numberOfStudents: number;
  numberOfSections: number;
  maxStudentsPerSection: number;
  isDefaultSection: boolean;
} 
export interface StudentRegisteredCoursesResult {
  totalDistinctCount: number;
  courses: StudentRegisteredCoursesModel[];
}