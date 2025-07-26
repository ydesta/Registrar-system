import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicantWorkExperienceComponent } from './applicant-work-experience.component';

describe('ApplicantWorkExperienceComponent', () => {
  let component: ApplicantWorkExperienceComponent;
  let fixture: ComponentFixture<ApplicantWorkExperienceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplicantWorkExperienceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicantWorkExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
