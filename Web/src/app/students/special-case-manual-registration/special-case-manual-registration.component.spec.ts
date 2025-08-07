import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialCaseManualRegistrationComponent } from './special-case-manual-registration.component';

describe('SpecialCaseManualRegistrationComponent', () => {
  let component: SpecialCaseManualRegistrationComponent;
  let fixture: ComponentFixture<SpecialCaseManualRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpecialCaseManualRegistrationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecialCaseManualRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
