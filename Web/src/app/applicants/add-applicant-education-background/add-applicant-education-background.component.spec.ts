import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddApplicantEducationBackgroundComponent } from './add-applicant-education-background.component';

describe('AddApplicantEducationBackgroundComponent', () => {
  let component: AddApplicantEducationBackgroundComponent;
  let fixture: ComponentFixture<AddApplicantEducationBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddApplicantEducationBackgroundComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddApplicantEducationBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
