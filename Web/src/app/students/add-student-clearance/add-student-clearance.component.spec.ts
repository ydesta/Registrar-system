import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStudentClearanceComponent } from './add-student-clearance.component';

describe('AddStudentClearanceComponent', () => {
  let component: AddStudentClearanceComponent;
  let fixture: ComponentFixture<AddStudentClearanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddStudentClearanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStudentClearanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
