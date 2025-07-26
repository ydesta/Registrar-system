import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicantRequestListComponent } from './applicant-request-list.component';

describe('ApplicantRequestListComponent', () => {
  let component: ApplicantRequestListComponent;
  let fixture: ComponentFixture<ApplicantRequestListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplicantRequestListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplicantRequestListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
