import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { QuadrantModel } from 'src/app/Models/QuadrantModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-quadrant',
  templateUrl: './quadrant.component.html',
  styleUrls: ['./quadrant.component.scss']
})
export class QuadrantComponent implements OnInit {

  quadrants?: QuadrantModel[];
  allQuadrants?: QuadrantModel[]; // Store all data for client-side pagination
  reqId = '';
  checked = false;
  pageindex = 1;
  totalRecord = 0;
  pageSize = 5;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  sortOrder = '';
  sortColumn = '';
  searchKey = '';
  isLoading = false;
  @ViewChild('emptyTpl') emptyTpl!: TemplateRef<void>;

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    this.fetchProgram();
  }

  fetchProgram() {
    this.isLoading = true;
    this._crudService.getList('/quadrants').subscribe((res: BaseModel<QuadrantModel[]>) => {
      this.allQuadrants = res.data;
      this.updateDisplayedData();
      this.isLoading = false;
    }, (error) => {
      console.error('Error fetching quadrants:', error);
      this.isLoading = false;
      this._customNotificationService.notification('error', 'Error', 'Failed to load quadrants');
    });
  }

  updateDisplayedData() {
    if (!this.allQuadrants) {
      this.quadrants = [];
      return;
    }

    // Filter data based on search key
    let filteredData = this.allQuadrants;
    if (this.searchKey && this.searchKey.trim() !== '') {
      const searchLower = this.searchKey.toLowerCase();
      filteredData = this.allQuadrants.filter(item => 
        (item.quadrantsID && item.quadrantsID.toLowerCase().includes(searchLower)) ||
        (item.quadrantHeading && item.quadrantHeading.toLowerCase().includes(searchLower)) ||
        (item.remark && item.remark.toLowerCase().includes(searchLower))
      );
    }

    // Update total record count for filtered data
    this.totalRecord = filteredData.length;

    // Let nz-table handle the pagination automatically
    this.quadrants = filteredData;
  }

  clickSearchKey() {
    this.pageindex = 1; // Reset to first page when searching
    this.updateDisplayedData();
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this quadrant?',
      // nzContent: '<b style="color: red;">Some descriptions</b>',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService.delete('/quadrants', this.reqId).subscribe((res: any) => {

          this.fetchProgram();
          if (res.status == "success") {
            this._customNotificationService.notification('success', 'Success', res.data)
          }
          if (res.status == "error") {
            this._customNotificationService.notification('error', 'Error', res.data)
          }
        })
      },
      nzCancelText: 'No',
      nzOnCancel: () => console.log('Cancel')
    });
  }
}
  