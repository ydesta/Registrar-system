export interface CourseRegistrationVisibility {
  academicTermId: number;
  showRegular: boolean;
  showAdd: boolean;
  showAssessment: boolean;
  showEquivalent: boolean;
  isConfigured: boolean;
}

export const DEFAULT_COURSE_REGISTRATION_VISIBILITY: CourseRegistrationVisibility = {
  academicTermId: 0,
  showRegular: true,
  showAdd: true,
  showAssessment: true,
  showEquivalent: true,
  isConfigured: false
};

export const REGISTRATION_ACTIVITY_TITLES = {
  Regular: 'Regular Registration',
  Add: 'ADD',
  Assessment: 'Assessment',
  Equivalent: 'Equivalent'
};
