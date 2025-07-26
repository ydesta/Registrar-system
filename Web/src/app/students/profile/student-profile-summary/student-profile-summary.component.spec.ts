import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentProfileSummaryComponent } from './student-profile-summary.component';

describe('StudentProfileSummaryComponent', () => {
  let component: StudentProfileSummaryComponent;
  let fixture: ComponentFixture<StudentProfileSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudentProfileSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentProfileSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
