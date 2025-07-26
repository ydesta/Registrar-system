import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAcademicTermActivityComponent } from './add-academic-term-activity.component';

describe('AddAcademicTermActivityComponent', () => {
  let component: AddAcademicTermActivityComponent;
  let fixture: ComponentFixture<AddAcademicTermActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAcademicTermActivityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAcademicTermActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
