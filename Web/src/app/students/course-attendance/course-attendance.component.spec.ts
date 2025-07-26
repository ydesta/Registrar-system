import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseAttendanceComponent } from './course-attendance.component';

describe('CourseAttendanceComponent', () => {
  let component: CourseAttendanceComponent;
  let fixture: ComponentFixture<CourseAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CourseAttendanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CourseAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
