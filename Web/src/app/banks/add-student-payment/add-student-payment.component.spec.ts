import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStudentPaymentComponent } from './add-student-payment.component';

describe('AddStudentPaymentComponent', () => {
  let component: AddStudentPaymentComponent;
  let fixture: ComponentFixture<AddStudentPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddStudentPaymentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStudentPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
