import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisteredStudentPerBatchComponent } from './registered-student-per-batch.component';

describe('RegisteredStudentPerBatchComponent', () => {
  let component: RegisteredStudentPerBatchComponent;
  let fixture: ComponentFixture<RegisteredStudentPerBatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegisteredStudentPerBatchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisteredStudentPerBatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
