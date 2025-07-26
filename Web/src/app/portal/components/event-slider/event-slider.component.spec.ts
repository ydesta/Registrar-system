import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventSliderComponent } from './event-slider.component';

describe('EventSliderComponent', () => {
  let component: EventSliderComponent;
  let fixture: ComponentFixture<EventSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventSliderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
