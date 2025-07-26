import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageStudentCourseRegistrationComponent } from './manage-student-course-registration.component';

describe('ManageStudentCourseRegistrationComponent', () => {
  let component: ManageStudentCourseRegistrationComponent;
  let fixture: ComponentFixture<ManageStudentCourseRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageStudentCourseRegistrationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageStudentCourseRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
