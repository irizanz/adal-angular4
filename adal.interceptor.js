import { Injectable } from '@angular/core';
import { mergeMap } from 'rxjs/operators';
import { AdalService } from './adal.service';
var AdalInterceptor = /** @class */ (function () {
    function AdalInterceptor(adal) {
        this.adal = adal;
    }
    AdalInterceptor.prototype.intercept = function (request, next) {
        // if the endpoint is not registered 
        // or if the header 'skip-adal' is set
        // then pass the request as it is to the next handler
        var resource = this.adal.getResourceForEndpoint(request.url);
        var skipAdal = request.headers.get('skip-adal');
        if (!resource || skipAdal) {
            return next.handle(request);
        }
        // if the user is not authenticated then drop the request
        if (!this.adal.userInfo.authenticated) {
            throw new Error('Cannot send request to registered endpoint if the user is not authenticated.');
        }
        // if the endpoint is registered then acquire and inject token
        return this.adal.acquireToken(resource)
            .pipe(mergeMap(function (token) {
            // clone the request and replace the original headers with
            // cloned headers, updated with the authorization
            var authorizedRequest = request.clone({
                headers: request.headers.set('Authorization', 'Bearer ' + token),
            });
            return next.handle(authorizedRequest);
        }));
    };
    AdalInterceptor.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */
    AdalInterceptor.ctorParameters = function () { return [
        { type: AdalService }
    ]; };
    return AdalInterceptor;
}());
export { AdalInterceptor };
//# sourceMappingURL=adal.interceptor.js.map