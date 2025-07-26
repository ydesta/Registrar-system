import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermCourseOfferingComponent } from './term-course-offering.component';

describe('TermCourseOfferingComponent', () => {
  let component: TermCourseOfferingComponent;
  let fixture: ComponentFixture<TermCourseOfferingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TermCourseOfferingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TermCourseOfferingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
