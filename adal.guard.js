import { Injectable } from '@angular/core';
import { AdalService } from './adal.service';
var AdalGuard = /** @class */ (function () {
    function AdalGuard(adalService) {
        this.adalService = adalService;
    }
    AdalGuard.prototype.canActivate = function (route, state) {
        return this.adalService.userInfo.authenticated;
    };
    AdalGuard.prototype.canActivateChild = function (childRoute, state) {
        return this.canActivate(childRoute, state);
    };
    AdalGuard.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */
    AdalGuard.ctorParameters = function () { return [
        { type: AdalService }
    ]; };
    return AdalGuard;
}());
export { AdalGuard };
//# sourceMappingURL=adal.guard.js.map