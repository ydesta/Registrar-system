import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

@Component({
  selector: "app-school-with-student-agreement",
  templateUrl: "./school-with-student-agreement.component.html",
  styleUrls: ["./school-with-student-agreement.component.scss"]
})
export class SchoolWithStudentAgreementComponent implements OnInit {
  @Output() formValidityChange = new EventEmitter<boolean>();
  @Output() formValueChange = new EventEmitter<any>();
  agreementForm: FormGroup;
  applyDate = new Date();

  constructor(private fb: FormBuilder) {
    this.createAcademicProgramRequest();
  }

  ngOnInit(): void {
    this.agreementForm.valueChanges.subscribe(() => {
      this.formValueChange.emit(this.agreementForm.value);
      this.formValidityChange.emit(this.agreementForm.valid);
    });
    this.formValueChange.emit(this.agreementForm.value);
    this.formValidityChange.emit(this.agreementForm.valid);
  }

  get isValid(): boolean {
    return this.agreementForm.valid;
  }

  get formValue() {
    return this.agreementForm.value;
  }

  createAcademicProgramRequest() {
    this.agreementForm = this.fb.group({
      sourceOfFinance: ["", [Validators.required]],
      howDidYouComeKnow: ["", [Validators.required]],
      selfConfirmedApplicantInformation: [false, [Validators.requiredTrue]]
    });
  }
}
