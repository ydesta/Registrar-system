import { CourseSectionAssignment } from './CourseSectionAssignment';

export interface StudentLab {
  sectionId: number;
  studentId: string; // Guid in C# maps to string in TypeScript
}

/**
 * Lab Section Assignment Request Interface
 * Used specifically for lab section assignments
 */
export interface LabSectionAssignmentRequest {
  batchCode: string;
  academicTerm: number;
  year: number;
  numberOfSections?: number;
  students: StudentLab[];
}

/**
 * Course Section Assignment Request Interface
 * Used specifically for course section assignments
 */
export interface CourseSectionAssignmentRequest {
  batchCode: string;
  academicTerm: number;
  year: number;
  numberOfSections?: number;
  courseAssignments: CourseSectionAssignment[];
}

/**
 * Bulk Section Assignment Request Interface
 * 
 * This interface supports two different types of section assignments:
 * 1. Lab Section Assignments: Use 'students' property with StudentLab array
 * 2. Course Section Assignments: Use 'courseAssignments' property with CourseSectionAssignment array
 * 
 * Note: At least one of 'students' or 'courseAssignments' should be provided
 * depending on the type of assignment being made.
 */
export interface BulkSectionAssignmentRequest {
  batchCode: string;
  academicTerm: number;
  year: number;
  numberOfSections?: number;
  students?: StudentLab[]; // For lab section assignments
  courseAssignments?: CourseSectionAssignment[]; // For course section assignments
}
export interface StudentSectionTransferRequest {
  studentIds: string[];
  sectionId: number;
  academicTerm: number;
  year: number;
  batchCode: string;
  sectionType: string;
}
export interface SectionTransferRequestWrapper {
  sourceSection: StudentSectionTransferRequest;
  targetSection: StudentSectionTransferRequest;
}