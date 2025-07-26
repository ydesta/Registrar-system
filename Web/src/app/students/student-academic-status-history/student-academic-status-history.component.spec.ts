import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentAcademicStatusHistoryComponent } from './student-academic-status-history.component';

describe('StudentAcademicStatusHistoryComponent', () => {
  let component: StudentAcademicStatusHistoryComponent;
  let fixture: ComponentFixture<StudentAcademicStatusHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudentAcademicStatusHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudentAcademicStatusHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
