import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseExemptionListComponent } from './course-exemption-list.component';

describe('CourseExemptionListComponent', () => {
  let component: CourseExemptionListComponent;
  let fixture: ComponentFixture<CourseExemptionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CourseExemptionListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseExemptionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
