import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicantEducationBackgroundComponent } from './applicant-education-background.component';

describe('ApplicantEducationBackgroundComponent', () => {
  let component: ApplicantEducationBackgroundComponent;
  let fixture: ComponentFixture<ApplicantEducationBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplicantEducationBackgroundComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicantEducationBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
