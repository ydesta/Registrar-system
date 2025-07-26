import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemesterRegistrationListComponent } from './semester-registration-list.component';

describe('SemesterRegistrationListComponent', () => {
  let component: SemesterRegistrationListComponent;
  let fixture: ComponentFixture<SemesterRegistrationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SemesterRegistrationListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemesterRegistrationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
