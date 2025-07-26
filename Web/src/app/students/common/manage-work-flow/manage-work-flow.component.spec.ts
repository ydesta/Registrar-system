import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageWorkFlowComponent } from './manage-work-flow.component';

describe('ManageWorkFlowComponent', () => {
  let component: ManageWorkFlowComponent;
  let fixture: ComponentFixture<ManageWorkFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageWorkFlowComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageWorkFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
