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
  curriculumQuadrants: CurriculumBreakdown[] = [];
  curriculumId = "";
  code: string;
  programme: string;
  numberOfQuadrantBreakdown = 0;
  editMode = false;
  loading = false;
  searchKey = "";
  expandSet = new Set<number>();

  constructor(
    private curriculumQuadrantBreakdownService: CurriculumQuadrantBreakdownService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.queryParams.subscribe(p => {
      this.curriculumId = p["id"];
      this.code = p["code"];
      this.programme = p["programme"];
      this.editMode = p["mode"] === "edit";
    });
  }

  ngOnInit(): void {
    this.getCurriculumQuadrantBreakdownByCurriculumId(this.curriculumId);
  }

  get filteredQuadrants(): CurriculumBreakdown[] {
    const key = (this.searchKey || "").trim().toLowerCase();
    if (!key) {
      return this.curriculumQuadrants;
    }
    return this.curriculumQuadrants.filter(q =>
      (q.quadrantCode || "").toLowerCase().includes(key) ||
      (q.remark || "").toLowerCase().includes(key)
    );
  }

  getCurriculumQuadrantBreakdownByCurriculumId(id: string) {
    this.loading = true;
    this.curriculumQuadrantBreakdownService
      .getCurriculumQuadrantBreakdownByCurriculumId(id)
      .subscribe({
        next: res => {
          this.curriculumQuadrants = res || [];
          this.numberOfQuadrantBreakdown = this.curriculumQuadrants.length;
          this.loading = false;
        },
        error: () => {
          this.curriculumQuadrants = [];
          this.numberOfQuadrantBreakdown = 0;
          this.loading = false;
        }
      });
  }

  courseCount(quadrant: CurriculumBreakdown): number {
    return quadrant?.course?.length || 0;
  }

  onExpandChange(id: number, checked: boolean): void {
    if (checked) {
      this.expandSet.add(id);
    } else {
      this.expandSet.delete(id);
    }
  }

  goToCurriculum() {
    this.router.navigateByUrl(`/curricula`);
  }

  doAction(): void {
    this.router.navigateByUrl(
      `curricula/quadrant-break-down-form?id=0&curriculum-id=${this.curriculumId}&curriculum-code=${this.code}&program=${this.programme}`
    );
  }

  editQuadrant(quadrant: CurriculumBreakdown): void {
    const quadrantId = quadrant.quadrantsID || "";
    this.router.navigateByUrl(
      `curricula/quadrant-break-down-form?id=${quadrant.id}&curriculum-id=${this.curriculumId}&curriculum-code=${this.code}&program=${this.programme}&quadrant-id=${quadrantId}&mode=edit`
    );
  }
}
