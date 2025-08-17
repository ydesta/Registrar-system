export interface LabSectionAssignedStudentInfo {
  id: string; // Guid in C# maps to string in TypeScript
  studentCode: string;
  batchCode: string;
  fullName: string;
  section: string;
}

export interface LabSectionAssignedStudentsResponse {
  data: LabSectionAssignedStudentInfo[];
  status: string;
  ex: any;
  error: any;
}
