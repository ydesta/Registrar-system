import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentSemsterCourseRegistrationSlipComponent } from './student-semster-course-registration-slip.component';

describe('StudentSemsterCourseRegistrationSlipComponent', () => {
  let component: StudentSemsterCourseRegistrationSlipComponent;
  let fixture: ComponentFixture<StudentSemsterCourseRegistrationSlipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudentSemsterCourseRegistrationSlipComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentSemsterCourseRegistrationSlipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
