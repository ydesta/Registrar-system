import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageQuadrantBreakdownComponent } from './manage-quadrant-breakdown.component';

describe('ManageQuadrantBreakdownComponent', () => {
  let component: ManageQuadrantBreakdownComponent;
  let fixture: ComponentFixture<ManageQuadrantBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageQuadrantBreakdownComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageQuadrantBreakdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
