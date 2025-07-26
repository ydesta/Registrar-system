import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcadamicProgrammeStatusComponent } from './acadamic-programme-status.component';

describe('AcadamicProgrammeStatusComponent', () => {
  let component: AcadamicProgrammeStatusComponent;
  let fixture: ComponentFixture<AcadamicProgrammeStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcadamicProgrammeStatusComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcadamicProgrammeStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
