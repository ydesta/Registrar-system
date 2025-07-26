import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuHelperComponent } from './menu-helper.component';

describe('MenuHelperComponent', () => {
  let component: MenuHelperComponent;
  let fixture: ComponentFixture<MenuHelperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MenuHelperComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuHelperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
