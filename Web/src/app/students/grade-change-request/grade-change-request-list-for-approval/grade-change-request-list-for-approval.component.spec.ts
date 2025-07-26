import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradeChangeRequestListForApprovalComponent } from './grade-change-request-list-for-approval.component';

describe('GradeChangeRequestListForApprovalComponent', () => {
  let component: GradeChangeRequestListForApprovalComponent;
  let fixture: ComponentFixture<GradeChangeRequestListForApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GradeChangeRequestListForApprovalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradeChangeRequestListForApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
