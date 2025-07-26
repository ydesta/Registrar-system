import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkFlowFormComponent } from './work-flow-form.component';

describe('WorkFlowFormComponent', () => {
  let component: WorkFlowFormComponent;
  let fixture: ComponentFixture<WorkFlowFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkFlowFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkFlowFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
