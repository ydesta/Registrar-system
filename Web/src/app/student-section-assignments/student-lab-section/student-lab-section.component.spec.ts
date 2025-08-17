import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentLabSectionComponent } from './student-lab-section.component';

describe('StudentLabSectionComponent', () => {
  let component: StudentLabSectionComponent;
  let fixture: ComponentFixture<StudentLabSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudentLabSectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentLabSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
