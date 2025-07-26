import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropCoursesComponent } from './drop-courses.component';

describe('DropCoursesComponent', () => {
  let component: DropCoursesComponent;
  let fixture: ComponentFixture<DropCoursesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DropCoursesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DropCoursesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
