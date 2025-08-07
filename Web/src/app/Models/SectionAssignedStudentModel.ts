export interface SectionAssignedStudentInfo {
  studentCode: string;
  batchCode: string;
  fullName: string;
  section: string;
  courseCode: string;
  courseTitle: string;
  courseId: string;
}

export interface SectionAssignedStudentsResponse {
  data: SectionAssignedStudentInfo[];
  status: string;
  ex: any;
  error: any;
} 