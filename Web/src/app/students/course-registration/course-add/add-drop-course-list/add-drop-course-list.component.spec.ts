import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDropCourseListComponent } from './add-drop-course-list.component';

describe('AddDropCourseListComponent', () => {
  let component: AddDropCourseListComponent;
  let fixture: ComponentFixture<AddDropCourseListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddDropCourseListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddDropCourseListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
