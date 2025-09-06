export interface InstructorSectionModel {
  id: number;
  staffId: string;
  sectionId: number;
  academicTerm: number;
  year: number;
  courseId: string;
  batchId: string;
  sectionType: number;
  createdBy: string;
  createdDate: Date;
  lastModifiedBy: string;
  lastModifiedDate: Date;
  isDeleted: boolean;
}

export interface InstructorSectionRequest {
  staffId: string;
  sectionId: number;
  academicTerm: number;
  year: number;
  courseId: string;
  batchId: string;
  sectionType: number;
  createdBy: string;
  lastModifiedBy: string;
}

export interface InstructorSectionAssignmentViewModel {
  id: number;
  fullName: string;
  section: string;
  academicTermYear: string;
  course: string;
  batchCode: string;
  staffId: string;
  sectionId: number;
  academicTerm: number;
  year: number;
  courseId: string;
  batchId: string;
}
