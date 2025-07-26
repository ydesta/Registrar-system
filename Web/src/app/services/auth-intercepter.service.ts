import { HttpErrorResponse, HttpHandler, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthIntercepterService {
  constructor (private _tokenStorageService:TokenStorageService){}
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this._tokenStorageService.getToken() ; 
    req = req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + token) });
    req = req.clone({ headers: req.headers.set('Accept', 'application/json') });
 
    return next.handle(req)
        .pipe(
           catchError((error: HttpErrorResponse) => {
                if (error && error.status === 401) {
                }
                const err = error.error.message || error.statusText;
                return throwError(error);                    
           })
        );
  }  
}
