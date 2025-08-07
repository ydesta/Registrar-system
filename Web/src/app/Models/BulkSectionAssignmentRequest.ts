import { CourseSectionAssignment } from './CourseSectionAssignment';

export interface BulkSectionAssignmentRequest {
  batchCode: string;
  academicTerm: number;
  year: number;
  numberOfSections?: number;
  courseAssignments: CourseSectionAssignment[];
} 