import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStudentFeedbackComponent } from './add-student-feedback.component';

describe('AddStudentFeedbackComponent', () => {
  let component: AddStudentFeedbackComponent;
  let fixture: ComponentFixture<AddStudentFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddStudentFeedbackComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStudentFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
