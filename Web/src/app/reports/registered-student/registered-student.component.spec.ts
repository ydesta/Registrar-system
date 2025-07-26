import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisteredStudentComponent } from './registered-student.component';

describe('RegisteredStudentComponent', () => {
  let component: RegisteredStudentComponent;
  let fixture: ComponentFixture<RegisteredStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegisteredStudentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisteredStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
