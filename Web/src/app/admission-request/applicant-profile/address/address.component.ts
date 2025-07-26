import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { GeneralInformationService } from '../../services/general-information.service';
import { environment } from 'src/environments/environment.prod';

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
    this.generalInformationService.getOrStoreParentApplicantId(userId).subscribe(applicantId => {
      this.id = applicantId;
      this.getApplicantById(applicantId);
    });
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
      this.form.patchValue(res.data);
      this.profilePicture =
        environment.fileUrl +
        "/Resources/profile/" +
        res.data.files[0]?.fileName;
    });
  }
}
