import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradingSystemComponent } from './grading-system.component';

describe('GradingSystemComponent', () => {
  let component: GradingSystemComponent;
  let fixture: ComponentFixture<GradingSystemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GradingSystemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GradingSystemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
