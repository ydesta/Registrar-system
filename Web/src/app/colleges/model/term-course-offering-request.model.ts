export class TermCourseOfferingRequest {
  public ID: string;
  //public AcademicTermCode: string;
  public CurriculumCode: string;
  public EntryYear: number;
  public BatchCode: string;
  public CourseCode: string;
  public ApprovedDate: Date;
  public StaffID: string;
  public Remark: string;
  public AcademicTermId: number;
  public AcademicTermSeason: number;
  public AcademicTermYear: number;
  public RegistrationStartDate: Date | string;
  public RegistrationEndDate: Date | string;
  public CourseId: string[];
  public Year: number;
}
