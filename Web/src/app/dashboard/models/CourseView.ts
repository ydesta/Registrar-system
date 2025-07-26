export interface CourseView {
  code: string;
  name: string;
  credits: number;
  term: string;
  grade?: number;
  prerequisites?: string[];
  status?: 'Completed' | 'In Progress';
}