import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentUrlService {
  readonly baseUrl = environment.baseUrl;
  readonly secureUrl = environment.secureUrl;
  readonly fileUrl = environment.fileUrl;
  readonly urlAddress = environment.baseUrl;
}
