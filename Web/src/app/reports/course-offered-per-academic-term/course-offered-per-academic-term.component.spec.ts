import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseOfferedPerAcademicTermComponent } from './course-offered-per-academic-term.component';

describe('CourseOfferedPerAcademicTermComponent', () => {
  let component: CourseOfferedPerAcademicTermComponent;
  let fixture: ComponentFixture<CourseOfferedPerAcademicTermComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CourseOfferedPerAcademicTermComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseOfferedPerAcademicTermComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
