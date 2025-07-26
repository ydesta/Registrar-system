import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCourseAttendanceComponent } from './add-course-attendance.component';

describe('AddCourseAttendanceComponent', () => {
  let component: AddCourseAttendanceComponent;
  let fixture: ComponentFixture<AddCourseAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCourseAttendanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCourseAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
