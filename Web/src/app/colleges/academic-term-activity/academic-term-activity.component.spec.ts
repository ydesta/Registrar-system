import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicTermActivityComponent } from './academic-term-activity.component';

describe('AcademicTermActivityComponent', () => {
  let component: AcademicTermActivityComponent;
  let fixture: ComponentFixture<AcademicTermActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcademicTermActivityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcademicTermActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
