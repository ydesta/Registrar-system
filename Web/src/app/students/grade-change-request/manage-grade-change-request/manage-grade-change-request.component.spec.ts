import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageGradeChangeRequestComponent } from './manage-grade-change-request.component';

describe('ManageGradeChangeRequestComponent', () => {
  let component: ManageGradeChangeRequestComponent;
  let fixture: ComponentFixture<ManageGradeChangeRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageGradeChangeRequestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageGradeChangeRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
