import { TestBed } from '@angular/core/testing';

import { CustomNotificationService } from './custom-notification.service';

describe('CustomNotificationService', () => {
  let service: CustomNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
