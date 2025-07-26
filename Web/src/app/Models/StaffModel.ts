export interface StaffModel {
    id: string,
    staffCode: string,
    firstName: string,
    lastName: string,
    gender: string,
    birthDate: Date,
    createdDate: Date,
    lastModifiedDate: Date,
    lastModifiedBy: string,
    createdBy: string,
    isDeleted: boolean
    mobile: string,
    email: string,
    userId: string;
    employmentType: number;
    title: string;
    nationality: string;
}