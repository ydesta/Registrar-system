import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisteredSemesterCoursesComponent } from './registered-semester-courses.component';

describe('RegisteredSemesterCoursesComponent', () => {
  let component: RegisteredSemesterCoursesComponent;
  let fixture: ComponentFixture<RegisteredSemesterCoursesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegisteredSemesterCoursesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisteredSemesterCoursesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
