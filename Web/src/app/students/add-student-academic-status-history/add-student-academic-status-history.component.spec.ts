import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStudentAcademicStatusHistoryComponent } from './add-student-academic-status-history.component';

describe('AddStudentAcademicStatusHistoryComponent', () => {
  let component: AddStudentAcademicStatusHistoryComponent;
  let fixture: ComponentFixture<AddStudentAcademicStatusHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddStudentAcademicStatusHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStudentAcademicStatusHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
