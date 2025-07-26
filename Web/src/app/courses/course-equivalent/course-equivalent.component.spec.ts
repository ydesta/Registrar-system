import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseEquivalentComponent } from './course-equivalent.component';

describe('CourseEquivalentComponent', () => {
  let component: CourseEquivalentComponent;
  let fixture: ComponentFixture<CourseEquivalentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CourseEquivalentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CourseEquivalentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
