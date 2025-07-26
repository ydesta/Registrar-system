import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicTermRegistrationSlipComponent } from './academic-term-registration-slip.component';

describe('AcademicTermRegistrationSlipComponent', () => {
  let component: AcademicTermRegistrationSlipComponent;
  let fixture: ComponentFixture<AcademicTermRegistrationSlipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcademicTermRegistrationSlipComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademicTermRegistrationSlipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
