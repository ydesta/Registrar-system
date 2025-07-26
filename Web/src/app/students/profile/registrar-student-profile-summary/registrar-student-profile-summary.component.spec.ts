import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarStudentProfileSummaryComponent } from './registrar-student-profile-summary.component';

describe('RegistrarStudentProfileSummaryComponent', () => {
  let component: RegistrarStudentProfileSummaryComponent;
  let fixture: ComponentFixture<RegistrarStudentProfileSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegistrarStudentProfileSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarStudentProfileSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
