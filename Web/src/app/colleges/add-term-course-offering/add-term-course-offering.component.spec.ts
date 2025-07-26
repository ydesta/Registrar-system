import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTermCourseOfferingComponent } from './add-term-course-offering.component';

describe('AddTermCourseOfferingComponent', () => {
  let component: AddTermCourseOfferingComponent;
  let fixture: ComponentFixture<AddTermCourseOfferingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTermCourseOfferingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTermCourseOfferingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
