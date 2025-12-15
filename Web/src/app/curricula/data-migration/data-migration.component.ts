import { Component, OnInit } from '@angular/core';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { DATA_MIGRATION } from 'src/app/common/constant';
import { DataMigrationService } from '../services/data-migration.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-data-migration',
  templateUrl: './data-migration.component.html',
  styleUrls: ['./data-migration.component.scss']
})
export class DataMigrationComponent implements OnInit {
  dataMigrationForm: FormGroup;
  dataMigrationList: StaticData[] = [];
  formData = new FormData();
  uploadType: number | null = null;
  readonly MAX_FILE_SIZE = 10485760; // 10MB
  readonly ALLOWED_FILE_TYPES = [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
  ];
  constructor(private _dataMigrationService: DataMigrationService,
    private _customNotificationService: CustomNotificationService,
    private _formBuilder: FormBuilder
  ) {
    this.initializeForm();
  }
  ngOnInit(): void {
    this.getListOfDataMigration();
    this.dataMigrationForm.get('uploadTypeList')?.valueChanges.subscribe(value => {
      this.uploadType = value;
      if (this.uploadType) {
        this.dataMigrationForm.get('file')?.enable();
      } else {
        this.dataMigrationForm.get('file')?.disable();
      }
    });
    this.dataMigrationForm.get('file')?.disable();
  }
  initializeForm() {
    this.dataMigrationForm = this._formBuilder.group({
      uploadTypeList: [null, Validators.required],
      file: [null, Validators.required],
    });
  }
  getListOfDataMigration() {
    let mig: StaticData = new StaticData();
    DATA_MIGRATION.forEach(pair => {
      mig = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.dataMigrationList.push(mig);
    });
  }
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > this.MAX_FILE_SIZE || !this.ALLOWED_FILE_TYPES.includes(file.type)) {
        this._customNotificationService.notification(
          'warn',
          'Invalid File',
          'File must be less than 10MB and in Excel format (.xls or .xlsx).'
        );
        return;
      }

      this.formData.set('file', file, file.name);

      if (this.uploadType) {
        this.checkDataMigration(this.uploadType, this.formData);
      } else {
        this._customNotificationService.notification(
          'warn',
          'Error',
          'Please select a migration type before uploading.'
        );
      }
    }
  }

  checkDataMigration(uploadType: number, formData: FormData): void {
    const serviceMethod = this.serviceMethodMap[uploadType];
    if (serviceMethod) {
      serviceMethod(formData).subscribe(
        res => this.handleSuccessResponse(),
        error => this.handleErrorResponse(error)
      );
    }
  }
  private handleSuccessResponse() {
    this._customNotificationService.notification(
      "success",
      "Success",
      "File uploaded and processed successfully."
    );
  }

  private handleErrorResponse(error: any) {
    const errorMessage = error?.error?.message || 'An error occurred during file upload.';
    this._customNotificationService.notification(
      "warn",
      "Error",
      errorMessage
    );
  }
  private serviceMethodMap = {
    1: this._dataMigrationService.getImportProgramFileAsync.bind(this._dataMigrationService),
    2: this._dataMigrationService.importCurriculumFileAsync.bind(this._dataMigrationService),
    3: this._dataMigrationService.getCourseFileAsync.bind(this._dataMigrationService),
    4: this._dataMigrationService.getImportBatchCodeFile.bind(this._dataMigrationService),
    5: this._dataMigrationService.getImportQuadrantFileAsync.bind(this._dataMigrationService),
    6: this._dataMigrationService.getImportCourseBreakdownFileAsync.bind(this._dataMigrationService),
    7: this._dataMigrationService.getStudentDataMigration.bind(this._dataMigrationService),
    8: this._dataMigrationService.getImportStaffFileAsync.bind(this._dataMigrationService),
    9: this._dataMigrationService.getImportTermCourseOfferingFile.bind(this._dataMigrationService),
    10: this._dataMigrationService.getImportStudentCourseRegistrationFile.bind(this._dataMigrationService),
    11: this._dataMigrationService.getStudentGradeFileAsync.bind(this._dataMigrationService),
  };

}
