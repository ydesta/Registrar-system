import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentCourseRegistrationComponent } from './student-course-registration.component';

describe('StudentCourseRegistrationComponent', () => {
  let component: StudentCourseRegistrationComponent;
  let fixture: ComponentFixture<StudentCourseRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudentCourseRegistrationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentCourseRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
