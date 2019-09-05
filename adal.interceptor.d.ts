import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdalService } from './adal.service';
export declare class AdalInterceptor implements HttpInterceptor {
    private adal;
    constructor(adal: AdalService);
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
}
