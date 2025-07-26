import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCoursePrerequisiteComponent } from './add-course-prerequisite.component';

describe('AddCoursePrerequisiteComponent', () => {
  let component: AddCoursePrerequisiteComponent;
  let fixture: ComponentFixture<AddCoursePrerequisiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCoursePrerequisiteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCoursePrerequisiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
