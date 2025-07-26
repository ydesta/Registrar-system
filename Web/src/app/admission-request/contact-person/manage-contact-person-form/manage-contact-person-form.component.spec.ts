import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageContactPersonFormComponent } from './manage-contact-person-form.component';

describe('ManageContactPersonFormComponent', () => {
  let component: ManageContactPersonFormComponent;
  let fixture: ComponentFixture<ManageContactPersonFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageContactPersonFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageContactPersonFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
