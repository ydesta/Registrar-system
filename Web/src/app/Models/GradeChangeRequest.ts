export class GradeChangeRequest {
    public id: number;
    public studentId: string;
    public courseId: string;
    public CurriculumId: string;
    public staffId: string;
    public previousGrade: string;
    public newGrade: string;
    public reason: string;
    public status: number;
    public academicTermId: number;
    public academicYear: number;
    public createdAt: Date;
    public updatedAt: Date

}