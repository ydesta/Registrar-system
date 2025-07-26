import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicStatusComponent } from './academic-status.component';

describe('AcademicStatusComponent', () => {
  let component: AcademicStatusComponent;
  let fixture: ComponentFixture<AcademicStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcademicStatusComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcademicStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
