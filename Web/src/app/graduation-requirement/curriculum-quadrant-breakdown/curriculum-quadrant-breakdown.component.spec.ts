import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurriculumQuadrantBreakdownComponent } from './curriculum-quadrant-breakdown.component';

describe('CurriculumQuadrantBreakdownComponent', () => {
  let component: CurriculumQuadrantBreakdownComponent;
  let fixture: ComponentFixture<CurriculumQuadrantBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurriculumQuadrantBreakdownComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CurriculumQuadrantBreakdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
