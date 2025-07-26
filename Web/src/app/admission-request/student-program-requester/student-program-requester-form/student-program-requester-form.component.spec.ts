import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentProgramRequesterFormComponent } from './student-program-requester-form.component';

describe('StudentProgramRequesterFormComponent', () => {
  let component: StudentProgramRequesterFormComponent;
  let fixture: ComponentFixture<StudentProgramRequesterFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudentProgramRequesterFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentProgramRequesterFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
