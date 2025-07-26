import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStudentRegistrationComponent } from './add-student-registration.component';

describe('AddStudentRegistrationComponent', () => {
  let component: AddStudentRegistrationComponent;
  let fixture: ComponentFixture<AddStudentRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddStudentRegistrationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStudentRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
