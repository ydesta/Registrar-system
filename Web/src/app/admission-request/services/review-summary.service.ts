import { Injectable } from '@angular/core';

export interface ReviewSummaryData {
  generalInformation: {
    personalInfo: {
      firstName: string;
      firstNameInAmh: string;
      sirName: string;
      sirNameInAmh?: string;
      fatherName: string;
      fatherNameInAmh: string;
      grandFatherName: string;
      grandFatherNameInAmh: string;
      motherName: string;
      gender: string;
      birthDate: any;
      birthPlace: string;
      nationality: string;
    };
    contactInfo: {
      emailAddress: string;
      mobile: string;
      telephonHome: string;
      telephonOffice: string;
    };
    addressInfo: {
      region: string;
      city: string;
      woreda: string;
      kebele: string;
    };
    identificationInfo: {
      nationalId: string;
      nationalExaminationId: string;
      tin: string;
    };
  };
  contactPerson: {
    count: number;
    hasContacts: boolean;
  };
  education: {
    count: number;
    hasEducation: boolean;
  };
  workExperience: {
    hasWorkExperience: boolean;
  };
  academicProgram: {
    count: number;
    hasPrograms: boolean;
    isValid: boolean;
  };
  applicationFee: {
    status: string;
    isPaid: boolean;
  };
  agreement: {
    sourceOfFinance: string;
    howDidYouComeKnow: string;
    selfConfirmedApplicantInformation: boolean;
    isValid: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReviewSummaryService {

  constructor() { }

  generateReviewSummaryContent(data: ReviewSummaryData): string {
    return `
      <div class="review-summary-modal">
        ${this.generateHeader()}
        ${this.generateContent(data)}
        ${this.generateNotice()}
        ${this.generateLoadingState()}
      </div>
    `;
  }

  private generateHeader(): string {
    return `
      <div class="summary-header">
        <div class="header-icon">
          <i nz-icon nzType="file-text" nzTheme="outline"></i>
        </div>
        <div class="header-content">
          <h3 class="header-title">Application Review Summary</h3>
          <p class="header-subtitle">Please review all information before submitting your application</p>
        </div>
      </div>
    `;
  }

  private generateContent(data: ReviewSummaryData): string {
    return `
      <div class="summary-content">
        ${this.generatePersonalInfoSection(data.generalInformation.personalInfo)}
        ${this.generateContactInfoSection(data.generalInformation.contactInfo)}
        ${this.generateAddressInfoSection(data.generalInformation.addressInfo)}
        ${this.generateAcademicDetailsSection(data)}
        ${this.generateAgreementSection(data.agreement)}
      </div>
    `;
  }

  private generatePersonalInfoSection(personalInfo: ReviewSummaryData['generalInformation']['personalInfo']): string {
    return `
      <div class="summary-section">
        <div class="section-header">
          <i nz-icon nzType="user" nzTheme="outline"></i>
          <h4>Personal Information</h4>
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="item-label">Full Name:</span>
            <span class="item-value">${personalInfo.firstName} ${personalInfo.sirName || ''}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Name (Amharic):</span>
            <span class="item-value">${personalInfo.firstNameInAmh} ${personalInfo.sirNameInAmh || ''}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Father's Name:</span>
            <span class="item-value">${personalInfo.fatherName}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Mother's Name:</span>
            <span class="item-value">${personalInfo.motherName}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Gender:</span>
            <span class="item-value">${personalInfo.gender}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Birth Date:</span>
            <span class="item-value">${this.formatDate(personalInfo.birthDate)}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Nationality:</span>
            <span class="item-value">${personalInfo.nationality}</span>
          </div>
        </div>
      </div>
    `;
  }

  private generateContactInfoSection(contactInfo: ReviewSummaryData['generalInformation']['contactInfo']): string {
    return `
      <div class="summary-section">
        <div class="section-header">
          <i nz-icon nzType="mail" nzTheme="outline"></i>
          <h4>Contact Information</h4>
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="item-label">Email Address:</span>
            <span class="item-value">${contactInfo.emailAddress || 'Not provided'}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Mobile Phone:</span>
            <span class="item-value">${contactInfo.mobile || 'Not provided'}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Home Phone:</span>
            <span class="item-value">${contactInfo.telephonHome || 'Not provided'}</span>
          </div>
        </div>
      </div>
    `;
  }

  private generateAddressInfoSection(addressInfo: ReviewSummaryData['generalInformation']['addressInfo']): string {
    return `
      <div class="summary-section">
        <div class="section-header">
          <i nz-icon nzType="home" nzTheme="outline"></i>
          <h4>Address Information</h4>
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="item-label">Region:</span>
            <span class="item-value">${addressInfo.region || 'Not provided'}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">City:</span>
            <span class="item-value">${addressInfo.city || 'Not provided'}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Woreda:</span>
            <span class="item-value">${addressInfo.woreda || 'Not provided'}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Kebele:</span>
            <span class="item-value">${addressInfo.kebele || 'Not provided'}</span>
          </div>
        </div>
      </div>
    `;
  }

  private generateAcademicDetailsSection(data: ReviewSummaryData): string {
    return `
      <div class="summary-section">
        <div class="section-header">
          <i nz-icon nzType="book" nzTheme="outline"></i>
          <h4>Academic & Contact Details</h4>
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="item-label">Contact Persons:</span>
            <span class="item-value">${data.contactPerson.count} person(s)</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Education Records:</span>
            <span class="item-value">${data.education.count} record(s)</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Academic Programs:</span>
            <span class="item-value">${data.academicProgram.count} program(s)</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Payment Status:</span>
            <span class="item-value status-${data.applicationFee.isPaid ? 'success' : 'warning'}">${data.applicationFee.status}</span>
          </div>
        </div>
      </div>
    `;
  }

  private generateAgreementSection(agreement: ReviewSummaryData['agreement']): string {
    return `
      <div class="summary-section">
        <div class="section-header">
          <i nz-icon nzType="safety-certificate" nzTheme="outline"></i>
          <h4>Agreement & Confirmation</h4>
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="item-label">Source of Finance:</span>
            <span class="item-value">${agreement.sourceOfFinance || 'Not provided'}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">How Did You Know:</span>
            <span class="item-value">${agreement.howDidYouComeKnow || 'Not provided'}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Information Confirmed:</span>
            <span class="item-value status-${agreement.selfConfirmedApplicantInformation ? 'success' : 'warning'}">${agreement.selfConfirmedApplicantInformation ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    `;
  }

  private generateNotice(): string {
    return `
      <div class="summary-notice">
        <div class="notice-icon">
          <i nz-icon nzType="exclamation-circle" nzTheme="fill"></i>
        </div>
        <div class="notice-content">
          <h4>Important Notice</h4>
          <p>Please review all information carefully. Once submitted, you may not be able to make changes to your application. Ensure all required fields are completed and information is accurate.</p>
        </div>
      </div>
    `;
  }

  private generateLoadingState(): string {
    return `
      <div *ngIf="reviewSubmissionLoading" class="submission-loading">
        <div class="loading-content">
          <span nz-icon nzType="loading" nzSpin="true"></span>
          <div class="loading-text">
            <h4>Submitting Your Application</h4>
            <p>Please wait while we process your application. This may take a few moments.</p>
          </div>
        </div>
      </div>
    `;
  }

  private formatDate(dateValue: any): string {
    if (!dateValue) return 'Not provided';
    
    try {
      let dateObj: Date;
      
      if (dateValue instanceof Date) {
        dateObj = dateValue;
      } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        dateObj = new Date(dateValue);
      } else {
        dateObj = new Date(dateValue);
      }
      
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (error) {
      return 'Invalid date';
    }
    
    return 'Invalid date';
  }
}
