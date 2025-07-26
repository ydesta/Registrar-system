import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurriculumBreakdownFormComponent } from './curriculum-breakdown-form.component';

describe('CurriculumBreakdownFormComponent', () => {
  let component: CurriculumBreakdownFormComponent;
  let fixture: ComponentFixture<CurriculumBreakdownFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurriculumBreakdownFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurriculumBreakdownFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
