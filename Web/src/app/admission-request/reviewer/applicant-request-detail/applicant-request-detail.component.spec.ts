import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicantRequestDetailComponent } from './applicant-request-detail.component';

describe('ApplicantRequestDetailComponent', () => {
  let component: ApplicantRequestDetailComponent;
  let fixture: ComponentFixture<ApplicantRequestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplicantRequestDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplicantRequestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
