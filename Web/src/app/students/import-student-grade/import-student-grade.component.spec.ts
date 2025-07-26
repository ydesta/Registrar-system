import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportStudentGradeComponent } from './import-student-grade.component';

describe('ImportStudentGradeComponent', () => {
  let component: ImportStudentGradeComponent;
  let fixture: ComponentFixture<ImportStudentGradeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportStudentGradeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportStudentGradeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
