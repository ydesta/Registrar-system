import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAcademicTermComponent } from './add-academic-term.component';

describe('AddAcademicTermComponent', () => {
  let component: AddAcademicTermComponent;
  let fixture: ComponentFixture<AddAcademicTermComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAcademicTermComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAcademicTermComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
