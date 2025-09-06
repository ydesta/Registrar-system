export interface CourseExemptionModel {
  id?: number;
  studentId: string;
  exemptionCourseId: string;
  exemptedCourseCode: string;
  exemptedCourseName: string;
  exemptedCollegeName: string;
  exemptedCourseCredit: number;
  reason: string;
  grade: string;
  createdBy?: string;
  lastModifiedBy?: string;
  createdDate?: Date;
  lastModifiedDate?: Date;
  isDeleted?: boolean;

  studentName?: string;
  exemptionCourse?: string;
  exemptionCourseCode?: string;
}

export interface CourseExemptionRequest {
  studentId: string;
  exemptionCourseId: string;
  exemptedCourseCode: string;
  exemptedCourseName: string;
  exemptedCourseCredit: number;
  exemptedCollegeName: string;
  reason: string;
  grade: string;
  createdBy?: string;
  lastModifiedBy?: string;
}
