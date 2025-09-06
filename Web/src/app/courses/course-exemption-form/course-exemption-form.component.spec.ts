import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseExemptionFormComponent } from './course-exemption-form.component';

describe('CourseExemptionFormComponent', () => {
  let component: CourseExemptionFormComponent;
  let fixture: ComponentFixture<CourseExemptionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CourseExemptionFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseExemptionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
