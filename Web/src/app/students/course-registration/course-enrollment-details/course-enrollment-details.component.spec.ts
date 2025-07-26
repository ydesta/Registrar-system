import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseEnrollmentDetailsComponent } from './course-enrollment-details.component';

describe('CourseEnrollmentDetailsComponent', () => {
  let component: CourseEnrollmentDetailsComponent;
  let fixture: ComponentFixture<CourseEnrollmentDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CourseEnrollmentDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseEnrollmentDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
