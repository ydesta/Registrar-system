export interface GradeRecordCorrectionSheet {
  studentCode: string;
  studentGuid: string;
  fullName: string;
  program: string;
  batchCode: string;
  entryYear: number;
  transcriptStatus: string;
  lines: GradeRecordCorrectionLine[];
  history: GradeRecordCorrectionHistory[];
  courses: GradeRecordCorrectionCourseOption[];
  batchCodes: string[];
}

export interface GradeRecordCorrectionLine {
  id: string;
  batchCode: string;
  year?: number;
  termSeason?: number;
  termName: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  creditHours?: number;
  gradeLetter: string;
  action: string;
  showOnTranscript: boolean;
  mark?: number;
}

export interface GradeRecordCorrectionSnapshot {
  batch: string;
  course: string;
  year: string;
  term: string;
  grade: string;
  action: string;
  showOnTranscript: string;
  credit: string;
  mark: string;
}

export interface GradeRecordCorrectionHistory {
  id: number;
  kind: string;
  reason: string;
  performedBy: string;
  createdAt: string;
  previous: GradeRecordCorrectionSnapshot;
  current: GradeRecordCorrectionSnapshot;
}

export interface GradeRecordCorrectionCourseOption {
  id: string;
  code: string;
  title: string;
  creditHours: number;
  label: string;
}

export interface ApplyGradeRecordCorrectionRequest {
  kind: 'Update' | 'Add' | 'Remove';
  studentCode: string;
  studentGradeId?: string | null;
  batchCode?: string;
  courseId?: string;
  courseCode?: string;
  year?: number;
  termSeason?: number;
  gradeLetter?: string;
  action?: string;
  showOnTranscript?: boolean;
  creditHours?: number;
  mark?: number | null;
  reason: string;
}
