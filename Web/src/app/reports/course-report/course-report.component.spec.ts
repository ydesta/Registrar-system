import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseReportComponent } from './course-report.component';

describe('CourseReportComponent', () => {
  let component: CourseReportComponent;
  let fixture: ComponentFixture<CourseReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CourseReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
