export interface CurriculumQuadrantBreakdownModel {
  id: number;
  curriculumCode: string;
  curriculum: any;
  courseCode: string;
  course: any;
  quadrantsId: string;
  quadrant: any;
  termNumber: number;
  yearNumber: number;
  remark: string;
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
  quadrantCode: string;
}
