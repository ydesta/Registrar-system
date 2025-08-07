export class StudentInformationView {
  id!: string;
  fullName!: string;
  studentCode!: string;
  entryYear!: number;
  academicProgram!: string;
  curriculumCode!: string;
  batchCode!: string;
  courses!: CourseInformation[];
}

export class CourseInformation {
  courseId?: string;
  courseCode!: string;
  courseTitle!: string;
  academicTerm?: number;
  academicYear?: number;
  previousGrade!: string;
}
