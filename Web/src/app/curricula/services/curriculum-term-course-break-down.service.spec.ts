import { TestBed } from '@angular/core/testing';

import { CurriculumTermCourseBreakDownService } from './curriculum-term-course-break-down.service';

describe('CurriculumTermCourseBreakDownService', () => {
  let service: CurriculumTermCourseBreakDownService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurriculumTermCourseBreakDownService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
