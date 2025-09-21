import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicantIncompleteComponent } from './applicant-incomplete.component';

describe('ApplicantIncompleteComponent', () => {
  let component: ApplicantIncompleteComponent;
  let fixture: ComponentFixture<ApplicantIncompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplicantIncompleteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplicantIncompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
