import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GeneralInformationService } from '../../services/general-information.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss']
})
export class AddressComponent {
  form: FormGroup;
  profilePicture = "";
  userId: string;
  id: string;
  constructor(private fb: FormBuilder,
    private generalInformationService: GeneralInformationService
  ) {
     this.userId = localStorage.getItem('userId');
    this.createForm();
  }
  ngOnInit(): void {
    const userId = localStorage.getItem('user_id');
    // this.generalInformationService.getOrStoreParentApplicantId(userId).subscribe(applicantId => {
    //   this.id = applicantId;
    //   this.getApplicantById(applicantId);
    // });
  }
  createForm() {
    this.form = this.fb.group({
      region: ["", []],
      city: ["", []],
      woreda: ["", []],
      kebele: ["", []],
      mobile: ["", []],
      telephonOffice: ["", []],
      telephonHome: ["", []],
      emailAddress: ["", []],
      postalAddress: ["", []],
    });
  }
  getApplicantById(id: string) {
    this.generalInformationService.getApplicantById(id).subscribe(res => {
      // Use helper method to extract data
      const applicantData = this.extractResponseData<any>(res);
      
      if (applicantData) {
        this.form.patchValue(applicantData);
        this.profilePicture =
          environment.fileUrl +
          "/Resources/profile/" +
          applicantData.files[0]?.fileName;
      }
    });
  }

  // Helper method to extract data from different response structures
  private extractResponseData<T>(res: any): T | null {
    if (res && typeof res === 'object') {
      // Check if response has data property (ApiResponse<T> structure)
      if ('data' in res && res.data) {
        return res.data;
      }
      // Check if response is the applicant object directly
      else if ('id' in res) {
        return res;
      }
    }
    return null;
  }
}
