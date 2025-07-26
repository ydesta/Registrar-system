import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAcadamicProgrammeComponent } from './add-acadamic-programme.component';

describe('AddAcadamicProgrammeComponent', () => {
  let component: AddAcadamicProgrammeComponent;
  let fixture: ComponentFixture<AddAcadamicProgrammeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAcadamicProgrammeComponent ]
    })
    .compileComponents();
    
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAcadamicProgrammeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
