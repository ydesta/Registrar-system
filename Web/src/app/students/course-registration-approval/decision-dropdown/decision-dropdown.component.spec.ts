import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecisionDropdownComponent } from './decision-dropdown.component';

describe('DecisionDropdownComponent', () => {
  let component: DecisionDropdownComponent;
  let fixture: ComponentFixture<DecisionDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DecisionDropdownComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DecisionDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
