import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursePrerequisiteComponent } from './course-prerequisite.component';

describe('CoursePrerequisiteComponent', () => {
  let component: CoursePrerequisiteComponent;
  let fixture: ComponentFixture<CoursePrerequisiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CoursePrerequisiteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CoursePrerequisiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
