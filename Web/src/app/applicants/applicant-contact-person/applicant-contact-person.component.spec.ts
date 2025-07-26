import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicantContactPersonComponent } from './applicant-contact-person.component';

describe('ApplicantContactPersonComponent', () => {
  let component: ApplicantContactPersonComponent;
  let fixture: ComponentFixture<ApplicantContactPersonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplicantContactPersonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicantContactPersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
