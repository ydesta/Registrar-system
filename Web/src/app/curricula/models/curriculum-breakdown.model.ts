export interface CurriculumBreakdown {
  id: string;
  quadrantCode: string;
  course: Course[];
}
export interface Course {
  courseTitle: string;
  courseCode: string;
  creditHours: number;
  lectureHours: number;
  labHours: number;
}
