import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraduationRequirementComponent } from './graduation-requirement.component';

describe('GraduationRequirementComponent', () => {
  let component: GraduationRequirementComponent;
  let fixture: ComponentFixture<GraduationRequirementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GraduationRequirementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GraduationRequirementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
