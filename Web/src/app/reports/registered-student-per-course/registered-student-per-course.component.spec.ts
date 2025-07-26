import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisteredStudentPerCourseComponent } from './registered-student-per-course.component';

describe('RegisteredStudentPerCourseComponent', () => {
  let component: RegisteredStudentPerCourseComponent;
  let fixture: ComponentFixture<RegisteredStudentPerCourseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegisteredStudentPerCourseComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisteredStudentPerCourseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
