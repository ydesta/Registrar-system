import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcadamicProgrammeCoordinatorComponent } from './acadamic-programme-coordinator.component';

describe('AcadamicProgramCoordinatorComponent', () => {
  let component: AcadamicProgrammeCoordinatorComponent;
  let fixture: ComponentFixture<AcadamicProgrammeCoordinatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcadamicProgrammeCoordinatorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcadamicProgrammeCoordinatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
