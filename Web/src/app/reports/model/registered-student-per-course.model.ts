import { StudentInformation } from "./student-information.model";

export class RegisteredStudentPerCourse {
    courseCode: string;
    courseTitle: string;
    academicTerm: string;
    studentInformation: StudentInformation[];
}
