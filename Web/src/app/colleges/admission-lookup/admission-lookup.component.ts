import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AdmissionLookupModel } from 'src/app/Models/AdmissionLookupModel';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { AcademicProgramRequestService } from 'src/app/admission-request/services/academic-program-request.service';
import { AcadamicProgramme } from 'src/app/admission-request/model/acadamic-programme.model';
import {
  ACADEMIC_TERM_STATUS,
  APPLICANT_TYPE_STATUS,
  Division_Status
} from 'src/app/common/constant';
import { AdmissionLookupService } from '../services/admission-lookup.service';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';

@Component({
  selector: 'app-admission-lookup',
  templateUrl: './admission-lookup.component.html',
  styleUrls: ['./admission-lookup.component.scss']
})
export class AdmissionLookupComponent implements OnInit, OnDestroy {
  lookups: AdmissionLookupModel[] = [];
  acadamicProgrammes: AcadamicProgramme[] = [];
  pager: ServerPaginator;
  reqId = '';

  constructor(
    private admissionLookupService: AdmissionLookupService,
    private academicProgramRequestService: AcademicProgramRequestService,
    private _customNotificationService: CustomNotificationService,
    private _modal: NzModalService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.loadPrograms();
    this.pager.init(() => this.fetchList());
    this.fetchList();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  loadPrograms() {
    this.academicProgramRequestService.getAacadamicPrgramtList().subscribe({
      next: (res: any) => {
        this.acadamicProgrammes = res?.data || [];
      }
    });
  }

  fetchList() {
    this.pager.loading = true;
    this.admissionLookupService.getListPaginated(this.pager.query()).subscribe({
      next: (res: any) => {
        this.lookups = res?.data || [];
        this.pager.applyResult(res);
      },
      error: () => {
        this.lookups = [];
        this.pager.fail();
      }
    });
  }

  getProgramTitle(id: string): string {
    const program = this.acadamicProgrammes.find(p => p.id === id);
    return program?.acadamicProgrammeTitle || '';
  }

  getDivisionLabel(id: number): string {
    return Division_Status.find(x => x.Id === id)?.Description || String(id);
  }

  getTermLabel(id: number): string {
    return ACADEMIC_TERM_STATUS.find(x => x.Id === id)?.Description || String(id);
  }

  getApplicantYearLabel(id: number): string {
    return APPLICANT_TYPE_STATUS.find(x => x.Id === id)?.Description || String(id);
  }

  showDeleteConfirm(id: string): void {
    this.reqId = id;
    this._modal.confirm({
      nzTitle: 'Are you sure you want to delete this Admission Lookup?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.admissionLookupService.delete(this.reqId).subscribe((res: any) => {
          this.fetchList();
          if (res.status === 'success') {
            this._customNotificationService.notification('success', 'Success', res.data);
          } else {
            this._customNotificationService.notification('error', 'Error', res.data);
          }
        });
      },
      nzCancelText: 'No'
    });
  }
}
