import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequirementQuandrantComponent } from './requirement-quandrant.component';

describe('RequirementQuandrantComponent', () => {
  let component: RequirementQuandrantComponent;
  let fixture: ComponentFixture<RequirementQuandrantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RequirementQuandrantComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RequirementQuandrantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
