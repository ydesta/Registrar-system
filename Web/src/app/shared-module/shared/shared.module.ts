import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NzTableModule } from "ng-zorro-antd/table";
import { NzDividerModule } from "ng-zorro-antd/divider";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzFormModule } from "ng-zorro-antd/form";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzDatePickerModule } from "ng-zorro-antd/date-picker";
import { NzUploadModule } from "ng-zorro-antd/upload";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NzCheckboxModule } from "ng-zorro-antd/checkbox";
import { NzNotificationModule } from "ng-zorro-antd/notification";
import { NzModalModule } from "ng-zorro-antd/modal";
import { NzInputNumberModule } from "ng-zorro-antd/input-number";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { NzAvatarModule } from "ng-zorro-antd/avatar";
import { NzSwitchModule } from "ng-zorro-antd/switch";
import { NzCardModule } from "ng-zorro-antd/card";
import { NzCollapseModule } from "ng-zorro-antd/collapse";
import { NzStepsModule } from "ng-zorro-antd/steps";
import { NzTabsModule } from "ng-zorro-antd/tabs";
import { NzResultModule } from "ng-zorro-antd/result";
import { NzPaginationModule } from "ng-zorro-antd/pagination";
import { NzTransferModule } from "ng-zorro-antd/transfer";
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTypographyModule } from "ng-zorro-antd/typography";
import { StudentSearchComponent } from "./components/student-search/student-search.component";

@NgModule({
  declarations: [StudentSearchComponent],
  imports: [CommonModule,ReactiveFormsModule],
  exports: [
    NzTableModule,
    NzDividerModule,
    NzIconModule,
    NzButtonModule,
    NzFormModule,
    NzSelectModule,
    NzInputModule,
    NzDatePickerModule,
    NzUploadModule,
    ReactiveFormsModule,
    FormsModule,
    NzCheckboxModule,
    NzNotificationModule,
    NzModalModule,
    NzInputNumberModule,
    NzDropDownModule,
    NzAvatarModule,
    NzSwitchModule,
    NzCardModule,
    NzCollapseModule,
    NzStepsModule,
    NzTabsModule,
    NzResultModule,
    NzPaginationModule,
    NzTransferModule,
    NzAlertModule,
    NzPageHeaderModule,
    NzSpinModule,
    NzTagModule,
    NzEmptyModule,
    NzSpinModule,
    NzTypographyModule,
    StudentSearchComponent
  ]
})
export class SharedModule {}
