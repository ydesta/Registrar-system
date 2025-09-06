import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAssignedInstructorSectionsComponent } from './view-assigned-instructor-sections.component';

describe('ViewAssignedInstructorSectionsComponent', () => {
  let component: ViewAssignedInstructorSectionsComponent;
  let fixture: ComponentFixture<ViewAssignedInstructorSectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewAssignedInstructorSectionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAssignedInstructorSectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
