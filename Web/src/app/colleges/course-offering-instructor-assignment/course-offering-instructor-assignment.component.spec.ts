import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseOfferingInstructorAssignmentComponent } from './course-offering-instructor-assignment.component';

describe('CourseOfferingInstructorAssignmentComponent', () => {
  let component: CourseOfferingInstructorAssignmentComponent;
  let fixture: ComponentFixture<CourseOfferingInstructorAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CourseOfferingInstructorAssignmentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseOfferingInstructorAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
