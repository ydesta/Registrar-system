import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicTermComponent } from './academic-term.component';

describe('AcademicTermComponent', () => {
  let component: AcademicTermComponent;
  let fixture: ComponentFixture<AcademicTermComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcademicTermComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcademicTermComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
