import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageStudentProgramRequesterComponent } from './manage-student-program-requester.component';

describe('ManageStudentProgramRequesterComponent', () => {
  let component: ManageStudentProgramRequesterComponent;
  let fixture: ComponentFixture<ManageStudentProgramRequesterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageStudentProgramRequesterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageStudentProgramRequesterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
