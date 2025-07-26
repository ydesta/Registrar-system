import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageWorkExperienceComponent } from './manage-work-experience.component';

describe('ManageWorkExperienceComponent', () => {
  let component: ManageWorkExperienceComponent;
  let fixture: ComponentFixture<ManageWorkExperienceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageWorkExperienceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageWorkExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
