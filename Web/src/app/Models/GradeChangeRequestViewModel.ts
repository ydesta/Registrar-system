export interface GradeChangeRequestViewModel {
  id: number;
  //studentCode: string;
  fullName: string;
  course: string;
  curriculumCode: string;
  academicTerm: string;
  previousGrade: string;
  newGrade: string;
  reason: string;
  status: string;
  reviewComments: string;
  instructorName: string;
  requestDate: Date;
}
export interface ChangeRequestViewModel {
  status: number;
  reviewComments?: string;
  lastModifiedBy: string;
}