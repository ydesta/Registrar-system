import { TestBed } from '@angular/core/testing';

import { AcadamicProgramService } from './acadamic-program.service';

describe('AcadamicProgramService', () => {
  let service: AcadamicProgramService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AcadamicProgramService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
