import { Component, OnInit } from "@angular/core";
import { CurriculumQuadrantBreakdownService } from "src/app/graduation-requirement/services/curriculum-quadrant-breakdown.service";
import { CurriculumBreakdown } from "../../models/curriculum-breakdown.model";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-manage-quadrant-breakdown",
  templateUrl: "./manage-quadrant-breakdown.component.html",
  styleUrls: ["./manage-quadrant-breakdown.component.scss"]
})
export class ManageQuadrantBreakdownComponent implements OnInit {
  curriculumQuadrants: CurriculumBreakdown[];
  curriculumId = "";
  activePanelKey: string;
  code: string;
  programme: string;
  numberOfQuadrantBreakdown = 0;

  constructor(
    private curriculumQuadrantBreakdownService: CurriculumQuadrantBreakdownService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.queryParams.subscribe(p => {
      this.curriculumId = p["id"];
      this.code = p["code"];
      this.programme = p["programme"];
    });
  }
  ngOnInit(): void {
    //this.curriculumId = this.router.snapshot.paramMap.get("id");
    this.getCurriculumQuadrantBreakdownByCurriculumId(this.curriculumId);
  }
  getCurriculumQuadrantBreakdownByCurriculumId(id: string) {
    this.curriculumQuadrantBreakdownService
      .getCurriculumQuadrantBreakdownByCurriculumId(id)
      .subscribe(res => {
        this.curriculumQuadrants = res;
        this.numberOfQuadrantBreakdown = res.length;
        if (res.length > 0) {
          this.activePanelKey = res[0].quadrantCode;
        }
      });
  }
  goToCurriculum() {    
    this.router.navigateByUrl(`/curricula`);
  }
  doAction(): void {
    const id = 0;
    this.router.navigateByUrl(
      `curricula/quadrant-break-down-form?id=${id}&&curriculum-id=${this.curriculumId}&&curriculum-code=${this.code}&&program=${this
        .programme}`
    );
  }
}
