import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCourseApprovalComponent } from './add-course-approval.component';

describe('AddCourseApprovalComponent', () => {
  let component: AddCourseApprovalComponent;
  let fixture: ComponentFixture<AddCourseApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCourseApprovalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCourseApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
