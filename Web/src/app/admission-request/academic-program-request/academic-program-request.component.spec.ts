import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicProgramRequestComponent } from './academic-program-request.component';

describe('AcademicProgramRequestComponent', () => {
  let component: AcademicProgramRequestComponent;
  let fixture: ComponentFixture<AcademicProgramRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcademicProgramRequestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademicProgramRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
