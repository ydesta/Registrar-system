import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuadrantBreakdownFormComponent } from './quadrant-breakdown-form.component';

describe('QuadrantBreakdownFormComponent', () => {
  let component: QuadrantBreakdownFormComponent;
  let fixture: ComponentFixture<QuadrantBreakdownFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuadrantBreakdownFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuadrantBreakdownFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
