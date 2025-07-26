import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCurriculumQuadrantBreakdownComponent } from './add-curriculum-quadrant-breakdown.component';

describe('AddCurriculumQuadrantBreakdownComponent', () => {
  let component: AddCurriculumQuadrantBreakdownComponent;
  let fixture: ComponentFixture<AddCurriculumQuadrantBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCurriculumQuadrantBreakdownComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCurriculumQuadrantBreakdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
