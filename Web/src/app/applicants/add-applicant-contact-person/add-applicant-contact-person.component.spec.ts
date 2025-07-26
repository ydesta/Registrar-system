import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddApplicantContactPersonComponent } from './add-applicant-contact-person.component';

describe('AddApplicantContactPersonComponent', () => {
  let component: AddApplicantContactPersonComponent;
  let fixture: ComponentFixture<AddApplicantContactPersonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddApplicantContactPersonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddApplicantContactPersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
