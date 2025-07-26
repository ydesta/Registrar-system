import { Component, Input, OnInit } from "@angular/core";
import { FileService } from "../../services/file.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-manage-files",
  templateUrl: "./manage-files.component.html",
  styleUrls: ["./manage-files.component.scss"]
})
export class ManageFilesComponent implements OnInit {
  fileList: any[] = [];
  @Input() areaId: string;
  /**
  *
  */
  constructor(private fileService: FileService) {}
  ngOnInit(): void {
    this.fileService.getFileById(this.areaId).subscribe(res => {
      this.fileList = res.data;
    });
  }

  viewFile(data: any) {
    let fileUrl = "";
    switch (data.category) {
      case "educationlevel":
        fileUrl =
          environment.fileUrl + "/Resources/educationlevel/" + data.fileName;
        break;
      case "workexperience":
        fileUrl =
          environment.fileUrl + "/Resources/workexperience/" + data.fileName;
        break;
      default:
        break;
    }
    if (fileUrl) {
      // Open the file URL in a new tab
      window.open(fileUrl, "_blank");
    }
  }
}
