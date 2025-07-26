import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcadamicProgrammeComponent } from './acadamic-programme.component';

describe('AcadamicProgramComponent', () => {
  let component: AcadamicProgrammeComponent;
  let fixture: ComponentFixture<AcadamicProgrammeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcadamicProgrammeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcadamicProgrammeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
