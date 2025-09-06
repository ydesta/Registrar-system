import { Injectable } from '@angular/core';

export interface PrintContentData {
  studentTermCourseReg: any;
  seasonTitles: string;
  getYearNumberDescription: (year: any) => string;
  getTotalCreditHours: () => number;
  getTotalAmount: () => number;
}

@Injectable({
  providedIn: 'root'
})
export class PrintContentService {

  generateRegistrationSlip(data: PrintContentData): string {
    if (!data.studentTermCourseReg || !data.studentTermCourseReg.courseTermOfferings) {
      return "<p>No data available to print.</p>";
    }

    const paymentStatus = (data.studentTermCourseReg?.coursePayment?.length ?? 0) > 0
      ? "REGISTERED AND PAID"
      : "NOT REGISTERED AND NOT PAID";

    const courseOfferingContent = data.studentTermCourseReg.courseTermOfferings.map((course: any) => `
        <tr style="border: 1px solid #ddd;">
          <td style="padding: 8px; border: 1px solid #ddd;">${course.courseCode}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${course.courseTitle}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: left;">${course.creditHours}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: left;">${course.totalAmount}</td>
        </tr>
    `).join('');

    return this.generateHtmlTemplate({
      paymentStatus,
      courseOfferingContent,
      seasonTitles: data.seasonTitles,
      studentTermCourseReg: data.studentTermCourseReg,
      getYearNumberDescription: data.getYearNumberDescription,
      getTotalCreditHours: data.getTotalCreditHours,
      getTotalAmount: data.getTotalAmount
    });
  }

  private generateHtmlTemplate(data: {
    paymentStatus: string;
    courseOfferingContent: string;
    seasonTitles: string;
    studentTermCourseReg: any;
    getYearNumberDescription: (year: any) => string;
    getTotalCreditHours: () => number;
    getTotalAmount: () => number;
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>HiLCoE Registration Slip</title>
          <style>
              ${this.getCssStyles()}
          </style>
      </head>
      <body>
          <div class="page-wrapper" style="max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; position: relative;">
            ${this.getWatermarks(data.paymentStatus)}
            ${this.getHeader()}
            ${this.getSubHeader(data.seasonTitles)}
            ${this.getStudentInfo(data.studentTermCourseReg, data.getYearNumberDescription)}
            ${this.getCourseTable(data.courseOfferingContent, data.getTotalCreditHours, data.getTotalAmount)}
            ${this.getSignatureSection()}
            ${this.getFooter()}
          </div>
      </body>
      </html>
    `;
  }

  private getCssStyles(): string {
    return `
      @page {
        size: letter;
        margin: 0.5in;
      }
      
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #fff;
        color: #333;
      }

      .page-wrapper {
        max-width: 800px;
        margin: 0 auto;
        background: #fff;
        padding: 20px;
        position: relative;
      }

      .header {
        text-align: center;
        border-bottom: 3px solid #093e96;
        padding-bottom: 15px;
        margin-bottom: 20px;
        position: relative;
      }

      .header img {
        max-height: 80px;
        width: auto;
        margin-bottom: 10px;
      }

      .header h2 { 
        margin: 0; 
        color: #093e96; 
        font-size: 24px;
        font-weight: 600;
      }

      .sub-header {
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        color: #093e96;
        margin-bottom: 25px;
      }

      .student-info {
        display: flex;
        justify-content: space-between;
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        border: 1px solid #e8e8e8;
      }

      .student-info div {
        flex: 1;
      }

      .student-info p {
        margin: 8px 0;
        font-size: 14px;
        line-height: 1.4;
      }

      .student-info .label {
        font-weight: 600;
        color: #666;
      }

      .student-info .value {
        color: #333;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        font-size: 14px;
      }

      th {
        background-color: #093e96;
        color: white;
        padding: 12px 8px;
        text-align: left;
        font-weight: 600;
        border: 1px solid #ddd;
      }

      td {
        padding: 8px;
        border: 1px solid #ddd;
      }

      tfoot td {
        background-color: #f8f9fa;
        font-weight: bold;
        padding: 12px 8px;
      }

      .signature-section {
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #093e96;
      }

      .signature-box {
        width: 45%;
        text-align: center;
      }

      .signature-box p {
        margin: 5px 0;
        font-size: 14px;
      }

      .signature-line {
        border-top: 1px solid #333;
        margin-top: 50px;
        width: 80%;
        margin-left: auto;
        margin-right: auto;
      }

      .watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 48px;
        font-weight: bold;
        color: rgba(9, 62, 150, 0.1);
        text-transform: uppercase;
        z-index: 1;
        pointer-events: none;
        user-select: none;
        white-space: nowrap;
      }

      .logo-watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        width: 400px;
        height: 400px;
        background-image: url('${window.location.origin}/assets/images/logo.png');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        opacity: 0.05;
        z-index: 1;
        pointer-events: none;
        user-select: none;
      }

      .footer {
        margin-top: 30px;
        text-align: center;
        font-size: 12px;
        color: #666;
        border-top: 1px solid #ddd;
        padding-top: 15px;
      }
    `;
  }

  private getWatermarks(paymentStatus: string): string {
    return `
      <div class="watermark" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 48px; font-weight: bold; color: rgba(9, 62, 150, 0.1); text-transform: uppercase; z-index: 1; pointer-events: none; user-select: none; white-space: nowrap;">${paymentStatus}</div>
      <div class="logo-watermark" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); width: 400px; height: 400px; background-image: url('${window.location.origin}/assets/images/logo.png'); background-size: contain; background-repeat: no-repeat; background-position: center; opacity: 0.05; z-index: 1; pointer-events: none; user-select: none;"></div>
    `;
  }

  private getHeader(): string {
    return `
      <div class="header" style="text-align: center; border-bottom: 3px solid #093e96; padding-bottom: 15px; margin-bottom: 20px; position: relative;">
          <img height="60" src="${window.location.origin}/assets/images/logo.png" alt="Logo" style="max-height: 80px; width: auto; margin-bottom: 10px;" />
          <h2 style="margin: 0; color: #093e96; font-size: 24px; font-weight: 600;">HiLCoE School of Computer Science and Technology</h2>
      </div>
    `;
  }

  private getSubHeader(seasonTitles: string): string {
    return `
      <div class="sub-header" style="text-align: center; font-size: 18px; font-weight: bold; color: #093e96; margin-bottom: 25px;">${seasonTitles} Slip</div>
    `;
  }

  private getStudentInfo(studentTermCourseReg: any, getYearNumberDescription: (year: any) => string): string {
    return `
      <div class="student-info" style="display: flex; justify-content: space-between; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e8e8e8;">
          <div style="flex: 1;">
              <p style="margin: 8px 0; font-size: 14px; line-height: 1.4;"><span style="font-weight: 600; color: #666;">Student Name:</span> <span style="color: #333;">${studentTermCourseReg?.fullName || 'N/A'}</span></p>
              <p style="margin: 8px 0; font-size: 14px; line-height: 1.4;"><span style="font-weight: 600; color: #666;">Student ID:</span> <span style="color: #333;">${studentTermCourseReg?.studentId || 'N/A'}</span></p>
          </div>
          <div style="flex: 1;">
              <p style="margin: 8px 0; font-size: 14px; line-height: 1.4;"><span style="font-weight: 600; color: #666;">Academic Year:</span> <span style="color: #333;">${getYearNumberDescription(studentTermCourseReg?.academicTermYear)}</span></p>
              <p style="margin: 8px 0; font-size: 14px; line-height: 1.4;"><span style="font-weight: 600; color: #666;">Batch Code:</span> <span style="color: #333;">${studentTermCourseReg?.batchCode || 'N/A'}</span></p>
              <p style="margin: 8px 0; font-size: 14px; line-height: 1.4;"><span style="font-weight: 600; color: #666;">FS Number:</span> <span style="color: #333;">____________________</span></p>
          </div>
      </div>
    `;
  }

  private getCourseTable(courseOfferingContent: string, getTotalCreditHours: () => number, getTotalAmount: () => number): string {
    return `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
          <thead>
              <tr>
                  <th style="background-color: #093e96; color: white; padding: 12px 8px; text-align: left; font-weight: 600; border: 1px solid #ddd;">Course Code</th>
                  <th style="background-color: #093e96; color: white; padding: 12px 8px; text-align: left; font-weight: 600; border: 1px solid #ddd;">Course Title</th>
                  <th style="background-color: #093e96; color: white; padding: 12px 8px; text-align: left; font-weight: 600; border: 1px solid #ddd;">Credit Hours</th>
                  <th style="background-color: #093e96; color: white; padding: 12px 8px; text-align: left; font-weight: 600; border: 1px solid #ddd;">Total Amount</th>
              </tr>
          </thead>
          <tbody>
              ${courseOfferingContent}
          </tbody>
          <tfoot>
              <tr>
                  <td colspan="2" style="background-color: #f8f9fa; font-weight: bold; padding: 12px 8px; border: 1px solid #ddd;">Total</td>
                  <td style="background-color: #f8f9fa; font-weight: bold; padding: 12px 8px; border: 1px solid #ddd;">${getTotalCreditHours()}</td>
                  <td style="background-color: #f8f9fa; font-weight: bold; padding: 12px 8px; border: 1px solid #ddd;">${getTotalAmount().toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
              </tr>
          </tfoot>
      </table>
    `;
  }

  private getSignatureSection(): string {
    return `
      <div class="signature-section" style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 2px solid #093e96;">
          <div class="signature-box" style="width: 45%; text-align: center;">
              <p style="margin: 5px 0; font-size: 14px;">Student Signature</p>
              <div class="signature-line" style="border-top: 1px solid #333; margin-top: 50px; width: 80%; margin-left: auto; margin-right: auto;"></div>
          </div>
          <div class="signature-box" style="width: 45%; text-align: center;">
              <p style="margin: 5px 0; font-size: 14px;">Authorized By</p>
              <div class="signature-line" style="border-top: 1px solid #333; margin-top: 50px; width: 80%; margin-left: auto; margin-right: auto;"></div>
          </div>
      </div>
    `;
  }

  private getFooter(): string {
    return `
      <div class="footer" style="margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
          <p style="margin: 0;">This slip is a proof of registration and should be kept for reference.</p>
      </div>
    `;
  }
}
