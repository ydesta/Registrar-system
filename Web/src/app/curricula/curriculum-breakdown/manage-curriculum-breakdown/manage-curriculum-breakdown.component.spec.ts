import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageCurriculumBreakdownComponent } from './manage-curriculum-breakdown.component';

describe('ManageCurriculumBreakdownComponent', () => {
  let component: ManageCurriculumBreakdownComponent;
  let fixture: ComponentFixture<ManageCurriculumBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageCurriculumBreakdownComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageCurriculumBreakdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
