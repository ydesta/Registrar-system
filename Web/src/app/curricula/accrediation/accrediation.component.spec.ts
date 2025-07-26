import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccrediationComponent } from './accrediation.component';

describe('AccrediationComponent', () => {
  let component: AccrediationComponent;
  let fixture: ComponentFixture<AccrediationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccrediationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AccrediationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
