import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddApplicantHistoryComponent } from './add-applicant-history.component';

describe('AddApplicantHistoryComponent', () => {
  let component: AddApplicantHistoryComponent;
  let fixture: ComponentFixture<AddApplicantHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddApplicantHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddApplicantHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
