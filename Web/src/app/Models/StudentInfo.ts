export interface StudentInfo {
  id: string;
  studentCode: string;
  fullName: string;
  batchCode: string;
  unassignedCourseCount: number;
}

export interface UnassignedStudentsResult {
  totalUnassignedStudents: number;
  recommendedNumberOfSections: number;
  studentsPerSection: number;
  remainingStudents: number;
  students: StudentInfo[];
}

export interface UnassignedStudentsResponse {
  data: UnassignedStudentsResult;
  status: string;
  ex: any;
  error: any;
}