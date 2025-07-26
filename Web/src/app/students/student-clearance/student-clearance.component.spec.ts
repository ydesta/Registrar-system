import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentClearanceComponent } from './student-clearance.component';

describe('StudentClearanceComponent', () => {
  let component: StudentClearanceComponent;
  let fixture: ComponentFixture<StudentClearanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudentClearanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudentClearanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
