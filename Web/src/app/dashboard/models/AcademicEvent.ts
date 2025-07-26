export interface AcademicEvent {
  title: string;
  date: string;
  description: string;
  location?: string;
  color: 'red' | 'blue' | 'green' | 'grey' | 'gray';
  tagColor: string;
}
