import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStudentEntryTruckingComponent } from './add-student-entry-trucking.component';

describe('AddStudentEntryTruckingComponent', () => {
  let component: AddStudentEntryTruckingComponent;
  let fixture: ComponentFixture<AddStudentEntryTruckingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddStudentEntryTruckingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStudentEntryTruckingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
