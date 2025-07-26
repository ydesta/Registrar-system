import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransfredCoursesComponent } from './transfred-courses.component';

describe('TransfredCoursesComponent', () => {
  let component: TransfredCoursesComponent;
  let fixture: ComponentFixture<TransfredCoursesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransfredCoursesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransfredCoursesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
