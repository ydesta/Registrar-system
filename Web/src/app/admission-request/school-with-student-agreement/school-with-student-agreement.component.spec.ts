import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolWithStudentAgreementComponent } from './school-with-student-agreement.component';

describe('SchoolWithStudentAgreementComponent', () => {
  let component: SchoolWithStudentAgreementComponent;
  let fixture: ComponentFixture<SchoolWithStudentAgreementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SchoolWithStudentAgreementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchoolWithStudentAgreementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
