import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentEntryTruckingComponent } from './student-entry-trucking.component';

describe('StudentEntryTruckingComponent', () => {
  let component: StudentEntryTruckingComponent;
  let fixture: ComponentFixture<StudentEntryTruckingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudentEntryTruckingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudentEntryTruckingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
