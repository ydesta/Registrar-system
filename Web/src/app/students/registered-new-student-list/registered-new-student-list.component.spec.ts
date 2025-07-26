import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisteredNewStudentListComponent } from './registered-new-student-list.component';

describe('RegisteredNewStudentListComponent', () => {
  let component: RegisteredNewStudentListComponent;
  let fixture: ComponentFixture<RegisteredNewStudentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegisteredNewStudentListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisteredNewStudentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
