import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBankTransactionComponent } from './add-bank-transaction.component';

describe('AddBankTransactionComponent', () => {
  let component: AddBankTransactionComponent;
  let fixture: ComponentFixture<AddBankTransactionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddBankTransactionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddBankTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
