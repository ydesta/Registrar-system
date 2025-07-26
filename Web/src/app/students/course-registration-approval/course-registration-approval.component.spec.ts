import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseRegistrationApprovalComponent } from './course-registration-approval.component';

describe('CourseRegistrationApprovalComponent', () => {
  let component: CourseRegistrationApprovalComponent;
  let fixture: ComponentFixture<CourseRegistrationApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CourseRegistrationApprovalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseRegistrationApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
