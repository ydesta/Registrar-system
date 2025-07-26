import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradeChangeRequestFormComponent } from './grade-change-request-form.component';

describe('GradeChangeRequestFormComponent', () => {
  let component: GradeChangeRequestFormComponent;
  let fixture: ComponentFixture<GradeChangeRequestFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GradeChangeRequestFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradeChangeRequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
