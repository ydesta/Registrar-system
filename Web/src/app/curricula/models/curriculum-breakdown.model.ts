export interface CurriculumBreakdown {
  id: number;
  quadrantCode: string;
  quadrantsID?: string;
  curriculumId?: string;
  minimumCreditHours?: number;
  remark?: string;
  course: Course[];
}
export interface Course {
  courseTitle: string;
  courseCode: string;
  creditHours: number;
  lectureHours: number;
  labHours: number;
  courseId?: string;
  parentId?: number;
}
