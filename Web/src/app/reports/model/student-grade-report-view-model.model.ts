export class StudentGradeReportCourseViewModel {
  serialNo: number;
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  grade: string;
  points: number | null;
}

export class StudentGradeReportTermViewModel {
  serialNo: number;
  academicTermSeason: number;
  academicTermName: string;
  year: number;
  termGPA: number | null;
  courses: StudentGradeReportCourseViewModel[];
}

export class StudentProfileInfoViewModel {
  studentId: string;
  fullName: string;
  academicProgram: string;
  birthDate: string | null;
  birthPlace: string;
  email: string;
  phoneNumber: string;
  batchCode: string;
  nationality: string;
  gender: string;
  entryYear: number;
}

export class StudentGradeReportViewModel {
  studentProfile: StudentProfileInfoViewModel;
  cgpa: number;
  academicTerms: StudentGradeReportTermViewModel[];
}
