import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-add-student-grade',
  templateUrl: './add-student-grade.component.html',
  styleUrls: ['./add-student-grade.component.scss'],
})
export class AddStudentGradeComponent implements OnInit {
  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Single-student and Excel grade entry live on Import Student Grade (OTP required).
    this.router.navigate(['/students/import-student-grade'], {
      replaceUrl: true,
      queryParams: {
        mode: 'single',
        from: this.activeRoute.snapshot.paramMap.get('id') || undefined
      }
    });
  }
}
