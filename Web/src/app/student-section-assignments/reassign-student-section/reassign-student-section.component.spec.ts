import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReassignStudentSectionComponent } from './reassign-student-section.component';

describe('ReassignStudentSectionComponent', () => {
  let component: ReassignStudentSectionComponent;
  let fixture: ComponentFixture<ReassignStudentSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReassignStudentSectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReassignStudentSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
