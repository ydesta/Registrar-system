import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAcadamicProgrammeStatusComponent } from './add-acadamic-programme-status.component';

describe('AddAcadamicProgramStatusComponent', () => {
  let component: AddAcadamicProgrammeStatusComponent;
  let fixture: ComponentFixture<AddAcadamicProgrammeStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAcadamicProgrammeStatusComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAcadamicProgrammeStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
