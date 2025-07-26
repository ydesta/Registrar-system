import { TestBed } from '@angular/core/testing';

import { BreadcrupService } from './breadcrup.service';

describe('BreadcrupService', () => {
  let service: BreadcrupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BreadcrupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
