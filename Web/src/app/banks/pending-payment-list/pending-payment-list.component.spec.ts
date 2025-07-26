import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingPaymentListComponent } from './pending-payment-list.component';

describe('PendingPaymentListComponent', () => {
  let component: PendingPaymentListComponent;
  let fixture: ComponentFixture<PendingPaymentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingPaymentListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingPaymentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
