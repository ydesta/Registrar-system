import { StudentInformation } from "./student-information.model";

export class RegisteredStudentPerBatch {
    academicTerm: string;
    batchCode: string;
    courseCode: string;
    courseTitle: string;
    studentInformation: StudentInformation[];
}
