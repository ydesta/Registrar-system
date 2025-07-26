import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentGradeReportComponent } from './student-grade-report.component';

describe('StudentGradeReportComponent', () => {
  let component: StudentGradeReportComponent;
  let fixture: ComponentFixture<StudentGradeReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudentGradeReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudentGradeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
