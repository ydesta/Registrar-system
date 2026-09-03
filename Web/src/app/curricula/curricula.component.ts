import { Component, OnDestroy, OnInit } from "@angular/core";
import { NzModalService } from "ng-zorro-antd/modal";
import { PaginatorService, ServerPaginator } from "../reports/services/paginator.service";
import { CrudService } from "../services/crud.service";
import { CustomNotificationService } from "../services/custom-notification.service";
import { Router } from "@angular/router";
import { StaticData } from "../admission-request/model/StaticData";
import { CURRICULUM_STATUS } from "../common/constant";
import { CurriculumStatusTrackingListComponent } from "./curriculum-status-tracking-list/curriculum-status-tracking-list.component";

@Component({
  selector: "app-curricula",
  templateUrl: "./curricula.component.html",
  styleUrls: ["./curricula.component.scss"]
})
export class CurriculaComponent implements OnInit, OnDestroy {
  curriculums: any[] = [];
  progId = "";
  checked = false;
  pager: ServerPaginator;
  listOfCurriculumStatus: StaticData[] = [];

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService,
    private router: Router,
    private _modal: NzModalService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.getListOfCurriculumStatus();
    this.pager.init(() => this.fetchProgram());
    this.fetchProgram();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  fetchProgram() {
    this.pager.loading = true;
    this._crudService
      .getPaginated(`/Curriculums`, this.pager.query())
      .subscribe({
        next: (res: any) => {
          this.curriculums = res?.data ?? [];
          this.pager.applyResult(res);
        },
        error: () => {
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to fetch curricula"
          );
          this.pager.fail();
        }
      });
  }

  onPageIndexChange(page: number): void {
    this.pager.onPageIndexChange(page);
  }

  onPageSizeChange(size: number): void {
    this.pager.onPageSizeChange(size);
  }

  onSort(event: string | null, column: string): void {
    this.pager.onSort(event, column);
  }

  showDeleteConfirm(id: any): void {
    this.progId = id;
    this.modal.confirm({
      nzTitle: "Are you sure delete this Curriculum?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService
          .delete("/Curriculums", this.progId)
          .subscribe((res: any) => {
            this.fetchProgram();
            if (res.status == "success") {
              this._customNotificationService.notification(
                "success",
                "Success",
                res.data
              );
            }
            if (res.status == "error") {
              this._customNotificationService.notification(
                "error",
                "Error",
                res.data
              );
            }
          });
      },
      nzCancelText: "No",
      nzOnCancel: () => {}
    });
  }

  exportCurriculum() {
    this._crudService.getList("/Curriculums/excel").subscribe((res: any) => {
      if (res.data.toString() == "No data found") {
        this._customNotificationService.notification(
          "error",
          "Error",
          res.data
        );
      } else {
        let fileLists = res.data.split("/");
        this._crudService.exportExcel("/" + res.data).subscribe((data: any) => {
          let downloadURL = window.URL.createObjectURL(data);
          let link = document.createElement("a");
          link.href = downloadURL;
          link.download = fileLists[fileLists.length - 1];
          link.click();
          this._customNotificationService.notification(
            "success",
            "Success",
            "Excel file is downloaded succesfully."
          );
        });
      }
    });
  }

  goToQuadrantBreakdown(data: any) {
    this.router.navigateByUrl(
      `/curricula/quadrant-break-down?id=${data.id}&code=${data.curriculumCode}&programme=${data
        .acadamicProgramme.acadamicProgrammeTitle}`
    );
  }

  goToCurriculumBreakdown(data: any) {
    this.router.navigateByUrl(
      `/curricula/curriculum-break-down?id=${data.id}&code=${data.curriculumCode}&programme=${data
        .acadamicProgramme.acadamicProgrammeTitle}`
    );
  }

  goToCurriculumTermYearBreakdown(data: any) {
    const id = 0;
    this.router.navigateByUrl(
      `curricula/curriculum-break-down-form?id=${id}&&curriculum-id=${data.id}&&curriculum-code=${data.curriculumCode}&&program=${data
        .acadamicProgramme.acadamicProgrammeTitle}`
    );
  }

  goToCurriculumQuadrantBreakdown(data: any) {
    const id = 0;
    this.router.navigateByUrl(
      `curricula/quadrant-break-down-form?id=${id}&&curriculum-id=${data.id}&&curriculum-code=${data.curriculumCode}&&program=${data
        .acadamicProgramme.acadamicProgrammeTitle}`
    );
  }

  goToEditQuadrantBreakdown(data: any) {
    this.router.navigateByUrl(
      `/curricula/quadrant-break-down?id=${data.id}&code=${data.curriculumCode}&programme=${data
        .acadamicProgramme.acadamicProgrammeTitle}&mode=edit`
    );
  }

  getListOfCurriculumStatus() {
    let division: StaticData = new StaticData();
    CURRICULUM_STATUS.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfCurriculumStatus.push(division);
    });
  }

  getCurriculumStatusDescription(Id: any) {
    const program = this.listOfCurriculumStatus.find(item => item.Id == Id);
    return program ? program.Description : "";
  }

  setTaxStatusColor(status) {
    const statusColors = {
      1: "green",
      2: "blue",
      3: "red"
    };

    return statusColors[status] || "black";
  }

  cellStyles(status) {
    const color = this.setTaxStatusColor(status);
    const fontSize = 16;

    return {
      color,
      "font-size": `${fontSize}px`
    };
  }

  openModal(id: string): void {
    if (!id) {
      this._customNotificationService.notification(
        "error",
        "Error",
        "Unable to open status tracking: curriculum id is missing."
      );
      return;
    }
    this._modal.create({
      nzTitle: "Curriculum Status Tracking List",
      nzContent: CurriculumStatusTrackingListComponent,
      nzComponentParams: {
        curriculumId: id
      },
      nzMaskClosable: false,
      nzFooter: null,
      nzWidth: 720,
      nzBodyStyle: { padding: "16px 20px 20px" },
      nzClassName: "custom-modal status-tracking-modal-wrap"
    });
  }
}
