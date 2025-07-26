import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRequirementQuadrantComponent } from './add-requirement-quadrant.component';

describe('AddRequirementQuadrantComponent', () => {
  let component: AddRequirementQuadrantComponent;
  let fixture: ComponentFixture<AddRequirementQuadrantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddRequirementQuadrantComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRequirementQuadrantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
