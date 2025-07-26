import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStatusTrackingComponent } from './add-status-tracking.component';

describe('AddStatusTrackingComponent', () => {
  let component: AddStatusTrackingComponent;
  let fixture: ComponentFixture<AddStatusTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddStatusTrackingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStatusTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
