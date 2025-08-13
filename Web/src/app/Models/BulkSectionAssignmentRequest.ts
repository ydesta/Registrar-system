import { CourseSectionAssignment } from './CourseSectionAssignment';

export interface BulkSectionAssignmentRequest {
  batchCode: string;
  academicTerm: number;
  year: number;
  numberOfSections?: number;
  courseAssignments: CourseSectionAssignment[];
} 
export interface StudentSectionTransferRequest {
  studentIds: string[];
  sectionId: number;
  academicTerm: number;
  year: number;
  batchCode: string;
}
export interface SectionTransferRequestWrapper {
  sourceSection: StudentSectionTransferRequest;
  targetSection: StudentSectionTransferRequest;
}