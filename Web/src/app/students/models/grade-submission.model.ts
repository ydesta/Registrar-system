export interface GradeSubmissionListItem {
  courseId: string;
  courseCode?: string;
  courseTitle?: string;
  course: string;
  batchCode: string;
  academicTermId: number;
  academicTerm: string;
  year?: number;
  termSeason?: number;
  staffId: string;
  instructor: string;
  studentCount: number;
  uploadedAt?: string;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  termCourseOfferingId?: string;
}

export interface GradeSubmissionLine {
  serialNo: number;
  gradeId: string;
  studentCode: string;
  fullName: string;
  mark?: number;
  gradeLetter: string;
  point?: number;
  creditHour?: number;
}

export interface GradeSubmissionDetail {
  submission: GradeSubmissionListItem;
  lines: GradeSubmissionLine[];
}

export interface AssignmentCourseOption {
  courseId: string;
  label: string;
}
