import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicantReviewerDecisionComponent } from './applicant-reviewer-decision.component';

describe('ApplicantReviewerDecisionComponent', () => {
  let component: ApplicantReviewerDecisionComponent;
  let fixture: ComponentFixture<ApplicantReviewerDecisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplicantReviewerDecisionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplicantReviewerDecisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
