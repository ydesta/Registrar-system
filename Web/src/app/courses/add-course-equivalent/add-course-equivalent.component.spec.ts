import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCourseEquivalentComponent } from './add-course-equivalent.component';

describe('AddCourseEquivalentComponent', () => {
  let component: AddCourseEquivalentComponent;
  let fixture: ComponentFixture<AddCourseEquivalentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCourseEquivalentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCourseEquivalentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
