export interface CourseSectionAssignment {
  courseId: string; // Using string for Guid in TypeScript
  maxStudentsPerSection: number;
  useDefaultSection: boolean;
  defaultSectionId?: number;
  numberOfSections?: number;
  isDefaultSection: boolean;
} 