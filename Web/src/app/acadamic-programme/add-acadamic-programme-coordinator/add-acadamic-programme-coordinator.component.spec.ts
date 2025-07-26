import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAcadamicProgrammeCoordinatorComponent } from './add-acadamic-programme-coordinator.component';

describe('AddAcadamicProgrammeCoordinatorComponent', () => {
  let component: AddAcadamicProgrammeCoordinatorComponent;
  let fixture: ComponentFixture<AddAcadamicProgrammeCoordinatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAcadamicProgrammeCoordinatorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAcadamicProgrammeCoordinatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
