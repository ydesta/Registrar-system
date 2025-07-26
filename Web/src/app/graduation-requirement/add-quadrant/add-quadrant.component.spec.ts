import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddQuadrantComponent } from './add-quadrant.component';

describe('AddQuadrantComponent', () => {
  let component: AddQuadrantComponent;
  let fixture: ComponentFixture<AddQuadrantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddQuadrantComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddQuadrantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
