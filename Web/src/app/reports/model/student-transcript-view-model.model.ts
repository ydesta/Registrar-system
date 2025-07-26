export class StudentTranscriptViewModel {
    // School Information
    public schoolName: string;
    public schoolContact: string;
    public schoolEmail: string;
    
    // Program Information
    public programme: string;
    public division: string;
    public status: string;
    public major: string;
    public awardDate: Date;
    public mediumOfInstruction: string;
    
    // Student Personal Information
    public fullName: string;
    public gender: string;
    public dateOfBirth: Date;
    public placeOfBirth: string;
    public admissionDate: Date;
    
    // Academic Terms
    public academicTerms: TranscriptTermViewModel[];
    
    // Overall Summary
    public totalCreditHours: number;
    public overallCGPA: number;
    public majorCGPA: number;
    
    // Footer Information
    public gradeScale: string;
    public validityNote: string;
    public creditHourConversion: string;
}

export class TranscriptTermViewModel {
    public termName: string;
    public year: number;
    public season: string;
    public courses: TranscriptCourseViewModel[];
    
    // Term Summary
    public totalCreditHours: number;
    public termTotalCreditHours: number;
    public termGPA: number;
    public termAverage: number;
    public cumulativeCreditHours: number;
    public cumulativeGPA: number;
    public cumulativeCGPA: number;
    public majorCreditHours: number;
    public majorGPA: number;
    public cumulativeMajorCreditHours: number;
    public cumulativeMajorGPA: number;
    public cumulativeMajorCGPA: number;
}

export class TranscriptCourseViewModel {
    public courseCode: string;
    public courseTitle: string;
    public creditHours: number;
    public grade: string;
    public gradePoint: number;
} 