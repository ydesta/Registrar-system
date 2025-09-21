export class StudentProfileViewModel {
    public id: string;
    public fullName: string
    public studentCode: string;
    public entryYear: string;
    public birthDate: Date;
    public gender: string
    public academicProgram: string;
    public curriculumCode: string
    public batch: string
    public photoUrl: string;
    public nationality: string;
    public birthPlace: string;
    public email: string;
    public phoneNo: string;
    public status: string;
    public isDeleted: boolean;
    public cgpa: number;
    public studentAcademicYears: StudentAcademicYears[];
    public studentCoursesTaken: StudentCoursesTaken[];
    public studentSectionYear: SectionYearResult[];
}
export class StudentAcademicYears {
    public academicYear: number;
    public year: number;
    public studentAcademicTerms: StudentAcademicTerms[]
}
export class StudentAcademicTerms {
    public academicTerm: number;
    public registrationDate: Date;
    public studentCoursesTaken: StudentCoursesTaken[]
}

export class StudentCoursesTaken {
    public courseId: string
    public courseCode: string
    public courseName: string
    public grade: string
    public creditHours: number;
    public points: number;
    public totalAmount: number;
    public priority: number;
    public approvalStatus: string;
    public registeredStatus: string;
    public academicTerm: string;
}
export class StudentAddedViewModel {
    public sudentId: string
    public courseId: string
    public studentCourseOfferingId: string
    public courseTakenId: string
    public fullName: string;
    public batchCode: string;
}
export class StudentRegistrationSlipViewModel {
    public fullName: string;
    public studentCode: string;
    public academicTerm: string;
    public batchCode: string;
    public fromBank: string;
    public toBank: string;
    public registrationDate: string;
    public bankTransactionId: string;
    public fileName: string;
    public courses: CourseViewModel[]
}
export class CourseViewModel {
    public id: string
    public courseTitle: string
    public courseCode: string
    public creditHours: number;
    public totalAmount: number;
}
export class RegisteredNewStudentViewModel {
    public id: string
    public fullName: string
    public academicProgram: string;
    public registeredDate: Date;
    public currentEmail: string;
    public previousEmail: string;
    public phoneNumber: string;
    public applicationUserId: string;
    public isEmailChanged: boolean;
    public entryYear: number
}
export interface CourseSectionAssignmentViewModel {
    courseCode: string;
    courseTitle: string;
    sectionName: string;
    instructor: string;
}

export interface StudentSectionResult {
    academicTerm: string;
    courseSections: CourseSectionAssignmentViewModel[];
}

export interface SectionYearResult {
    year: number;
    studentSection: StudentSectionResult[];
}
