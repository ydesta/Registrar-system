import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentCourseSectionAssignmentComponent } from './student-course-section-assignment.component';

describe('StudentCourseSectionAssignmentComponent', () => {
  let component: StudentCourseSectionAssignmentComponent;
  let fixture: ComponentFixture<StudentCourseSectionAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudentCourseSectionAssignmentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentCourseSectionAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
