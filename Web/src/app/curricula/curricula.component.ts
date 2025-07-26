import { Component, OnInit } from "@angular/core";
import { NzModalRef, NzModalService } from "ng-zorro-antd/modal";
import { CrudService } from "../services/crud.service";
import { CustomNotificationService } from "../services/custom-notification.service";
import { Router } from "@angular/router";
import { ColumnItem } from "./models/ColumnItem";
import { StaticData } from "../admission-request/model/StaticData";
import { CURRICULUM_STATUS } from "../common/constant";
import { CurriculumStatusTrackingListComponent } from "./curriculum-status-tracking-list/curriculum-status-tracking-list.component";

@Component({
  selector: "app-curricula",
  templateUrl: "./curricula.component.html",
  styleUrls: ["./curricula.component.scss"]
})
export class CurriculaComponent implements OnInit {
  curriculums: any;
  progId = "";
  checked = false;
  searchKey = "";
  pageindex = 1;
  pageSize = 5;
  sortOrder = "";
  sortColumn = "";
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  totalRecord = 0;
  tbLoading = true;
  listOfColumns: ColumnItem[] = [
    {
      name: "Curriculum Code",
      sortOrder: null,
      sortFn: (a: any, b: any) =>
        a.curriculumCode.localeCompare(b.curriculumCode),
      sortDirections: ["ascend", "descend", null],
      filterMultiple: true,
      listOfFilter: [],
      filterFn: (list: string[], item: any) =>
        list.some(name => item.curriculumCode.indexOf(name) !== -1)
    },
    {
      name: "Programme Title",
      sortOrder: "descend",
      sortFn: (a: any, b: any) =>
        a.acadamicProgramme.acadamicProgrammeTitle.localeCompare(
          b.acadamicProgramme.acadamicProgrammeTitle
        ),
      sortDirections: ["descend", null],
      listOfFilter: [],
      filterFn: null,
      filterMultiple: true
    },
    {
      name: "Minimum Cumulative GPA",
      sortOrder: null,
      sortDirections: ["ascend", "descend", null],
      sortFn: (a: any, b: any) => a.minimumCumlativGPA,
      filterMultiple: false,
      listOfFilter: [],
      filterFn: null
    },
    {
      name: "Minimum Major GPA",
      sortOrder: "descend",
      sortFn: (a: any, b: any) =>
        a.minimumMajorGPA,
      sortDirections: ["descend", null],
      listOfFilter: [],
      filterFn: null,
      filterMultiple: false
    },
    {
      name: "Min Total Credit Hours",
      sortOrder: null,
      sortDirections: ["ascend", "descend", null],
      sortFn: (a: any, b: any) => a.minTotalCreditHours,
      filterMultiple: false,
      listOfFilter: [],
      filterFn: null
    },
    {
      name: "Passing Grade",
      sortOrder: null,
      sortDirections: ["ascend", "descend", null],
      sortFn: (a: any, b: any) => a.passingGrade,
      filterMultiple: false,
      listOfFilter: [],
      filterFn: null
    },
    {
      name: "Status",
      sortOrder: null,
      sortDirections: ["ascend", "descend", null],
      sortFn: (a: any, b: any) => a.status.length - b.status.length,
      filterMultiple: false,
      listOfFilter: [],
      filterFn: null
    }
  ];
  listOfCurriculumStatus: StaticData[] = [];
  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService,
    private router: Router,
    private _modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.fetchProgram();
    this.getListOfCurriculumStatus();
  }
  fetchProgram() {
    this.tbLoading = true;
    this._crudService
      .getList(
        `/Curriculums/paginated?searchKey=${this.searchKey}&pageindex=${
          this.pageindex - 1
        }&pageSize=${this.pageSize}&sortColumn=${this.sortColumn}&sortOrder=${
          this.sortOrder
        }`
      )
      .subscribe({
        next: (res: any) => {
          this.curriculums = res.data;
          this.totalRecord = res.totalRowCount;
          this.pageSize = res.itemPerPage;
          this.pageindex = res.currentPage + 1;
          this.populateFilterOptions();
          this.tbLoading = false;
        },
        error: (error) => {
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to fetch curricula"
          );
          this.tbLoading = false;
        }
      });
  }
  showDeleteConfirm(id: any): void {
    this.progId = id;
    this.modal.confirm({
      nzTitle: "Are you sure delete this Curriculum?",
      // nzContent: '<b style="color: red;">Some descriptions</b>',
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
      nzOnCancel: () => console.log("Cancel")
    });
  }
  clickSearchKey() {
    this.fetchProgram();
  }

  onSearch() {
    this.pageindex = 1;
    this.fetchProgram();
  }

  paginatedIndexEvent(event: number): void {
    this.pageindex = event;
    this.fetchProgram();
  }

  paginatedSizeEvent(event: number): void {
    this.pageSize = event;
    this.pageindex = 1; // Reset to first page when page size changes
    this.fetchProgram();
  }

  exportCurriculum() {
    this._crudService.getList("/Curriculums/excel").subscribe((res: any) => {
      //acadamic-programme
      if (res.data.toString() == "No data found") {
        this._customNotificationService.notification(
          "error",
          "Error",
          res.data
        );
      } else {
        let fileLists = res.data.split("/");
        this._crudService.expoerExcel("/" + res.data).subscribe((data: any) => {
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
  populateFilterOptions(): void {
    this.listOfColumns.forEach(column => {
      if (column.name === "Curriculum Code") {
        const values = new Set<string>();
        this.curriculums.forEach(data => {
          values.add(data.curriculumCode);
        });
        column.listOfFilter = Array.from(values).map(value => ({
          text: value,
          value
        }));
      }
      // Add similar logic for other columns if needed
    });
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
    this._modal.create({
      nzTitle: "Curriculum Status Tracking List",
      nzContent: CurriculumStatusTrackingListComponent,
      nzComponentParams: {
        curriculumId: id
      },
      nzMaskClosable: false,
      nzFooter: null,
      nzWidth: "50%",
      nzClassName: "custom-modal"
    });
  }
}
