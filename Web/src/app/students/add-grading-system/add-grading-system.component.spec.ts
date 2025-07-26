import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddGradingSystemComponent } from './add-grading-system.component';

describe('AddGradingSystemComponent', () => {
  let component: AddGradingSystemComponent;
  let fixture: ComponentFixture<AddGradingSystemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddGradingSystemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddGradingSystemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
