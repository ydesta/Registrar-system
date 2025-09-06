export interface LabSectionAssignedStudentInfo {
  id: string; // Guid in C# maps to string in TypeScript
  studentCode: string;
  batchCode: string;
  fullName: string;
  section: string;
  sectionId: number; 
  numberOfGeneratedSections: number;
}

export interface LabSectionAssignedStudentsResponse {
  data: LabSectionAssignedStudentInfo[];
  status: string;
  ex: any;
  error: any;
}
