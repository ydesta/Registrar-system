import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurriculumStatusTrackingListComponent } from './curriculum-status-tracking-list.component';

describe('CurriculumStatusTrackingListComponent', () => {
  let component: CurriculumStatusTrackingListComponent;
  let fixture: ComponentFixture<CurriculumStatusTrackingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurriculumStatusTrackingListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurriculumStatusTrackingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
