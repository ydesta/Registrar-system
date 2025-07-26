import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCourseRequestComponent } from './add-course-request.component';

describe('AddCourseRequestComponent', () => {
  let component: AddCourseRequestComponent;
  let fixture: ComponentFixture<AddCourseRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCourseRequestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCourseRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
