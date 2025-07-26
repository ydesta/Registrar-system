import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAccrediationComponent } from './add-accrediation.component';

describe('AddAccrediationComponent', () => {
  let component: AddAccrediationComponent;
  let fixture: ComponentFixture<AddAccrediationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAccrediationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAccrediationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
