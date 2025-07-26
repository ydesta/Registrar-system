import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAcademicStatusComponent } from './add-academic-status.component';

describe('AddAcademicStatusComponent', () => {
  let component: AddAcademicStatusComponent;
  let fixture: ComponentFixture<AddAcademicStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAcademicStatusComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAcademicStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
