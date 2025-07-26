import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyValuesComponent } from './company-values.component';

describe('CompanyValuesComponent', () => {
  let component: CompanyValuesComponent;
  let fixture: ComponentFixture<CompanyValuesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyValuesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyValuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
