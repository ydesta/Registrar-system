import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicantHistoryComponent } from './applicant-history.component';

describe('ApplicantHistoryComponent', () => {
  let component: ApplicantHistoryComponent;
  let fixture: ComponentFixture<ApplicantHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplicantHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicantHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
