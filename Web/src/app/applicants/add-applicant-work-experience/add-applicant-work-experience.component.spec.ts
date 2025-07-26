import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddApplicantWorkExperienceComponent } from './add-applicant-work-experience.component';

describe('AddApplicantWorkExperienceComponent', () => {
  let component: AddApplicantWorkExperienceComponent;
  let fixture: ComponentFixture<AddApplicantWorkExperienceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddApplicantWorkExperienceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddApplicantWorkExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
