import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTuitionFeeComponent } from './add-tuition-fee.component';

describe('AddTuitionFeeComponent', () => {
  let component: AddTuitionFeeComponent;
  let fixture: ComponentFixture<AddTuitionFeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTuitionFeeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTuitionFeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
