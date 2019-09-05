/// <reference path="adal-angular.d.ts" />
import { Injectable, NgZone } from '@angular/core';
import { bindCallback } from 'rxjs';
import { map } from 'rxjs/operators';
import * as lib from 'adal-angular';
var AdalService = /** @class */ (function () {
    function AdalService(ngZone) {
        this.ngZone = ngZone;
        this.context = null;
        this.loginRefreshTimer = null;
        this.user = {
            authenticated: false,
            userName: '',
            error: '',
            token: '',
            profile: {},
            loginCached: false
        };
    }
    AdalService.prototype.init = function (configOptions) {
        if (!configOptions) {
            throw new Error('You must set config, when calling init.');
        }
        // redirect and logout_redirect are set to current location by default
        var existingHash = window.location.hash;
        var pathDefault = window.location.href;
        if (existingHash) {
            pathDefault = pathDefault.replace(existingHash, '');
        }
        configOptions.redirectUri = configOptions.redirectUri || pathDefault;
        configOptions.postLogoutRedirectUri = configOptions.postLogoutRedirectUri || pathDefault;
        // create instance with given config
        this.context = lib.inject(configOptions);
        this.updateDataFromCache();
        if (this.user.loginCached && !this.user.authenticated && window.self == window.top && !this.isInCallbackRedirectMode) {
            this.refreshLoginToken();
        }
        else if (this.user.loginCached && this.user.authenticated && !this.loginRefreshTimer && window.self == window.top) {
            this.setupLoginTokenRefreshTimer();
        }
    };
    Object.defineProperty(AdalService.prototype, "config", {
        get: function () {
            return this.context.config;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AdalService.prototype, "userInfo", {
        get: function () {
            return this.user;
        },
        enumerable: true,
        configurable: true
    });
    AdalService.prototype.login = function () {
        this.context.login();
    };
    AdalService.prototype.loginInProgress = function () {
        return this.context.loginInProgress();
    };
    AdalService.prototype.logOut = function () {
        this.context.logOut();
    };
    AdalService.prototype.handleWindowCallback = function (removeHash) {
        if (removeHash === void 0) { removeHash = true; }
        var hash = window.location.hash;
        if (this.context.isCallback(hash)) {
            var isPopup = false;
            if (this.context._openedWindows.length > 0 && this.context._openedWindows[this.context._openedWindows.length - 1].opener && this.context._openedWindows[this.context._openedWindows.length - 1].opener._adalInstance) {
                this.context = this.context._openedWindows[this.context._openedWindows.length - 1].opener._adalInstance;
                isPopup = true;
            }
            else if (window.parent && window.parent._adalInstance) {
                this.context = window.parent._adalInstance;
            }
            var requestInfo = this.context.getRequestInfo(hash);
            this.context.saveTokenFromHash(requestInfo);
            var callback = this.context._callBackMappedToRenewStates[requestInfo.stateResponse] || this.context.callback;
            if (requestInfo.requestType === this.context.REQUEST_TYPE.LOGIN) {
                this.updateDataFromCache();
                this.setupLoginTokenRefreshTimer();
            }
            if (requestInfo.stateMatch) {
                if (typeof callback === 'function') {
                    if (requestInfo.requestType === this.context.REQUEST_TYPE.RENEW_TOKEN) {
                        // Idtoken or Accestoken can be renewed
                        if (requestInfo.parameters['access_token']) {
                            callback(this.context._getItem(this.context.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters['access_token']);
                        }
                        else if (requestInfo.parameters['id_token']) {
                            callback(this.context._getItem(this.context.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters['id_token']);
                        }
                        else if (requestInfo.parameters['error']) {
                            callback(this.context._getItem(this.context.CONSTANTS.STORAGE.ERROR_DESCRIPTION), null);
                            this.context._renewFailed = true;
                        }
                    }
                }
            }
        }
        // Remove hash from url
        if (removeHash) {
            if (window.location.hash) {
                if (window.history.replaceState) {
                    window.history.replaceState('', '/', window.location.pathname);
                }
                else {
                    window.location.hash = '';
                }
            }
        }
    };
    AdalService.prototype.getCachedToken = function (resource) {
        return this.context.getCachedToken(resource);
    };
    AdalService.prototype.acquireToken = function (resource) {
        var _this = this;
        return bindCallback(function (callback) {
            _this.context.acquireToken(resource, function (error, tokenOut) {
                if (error) {
                    _this.context.error('Error when acquiring token for resource: ' + resource, error);
                    callback(null, error);
                }
                else {
                    callback(tokenOut, null);
                }
            });
        })()
            .pipe(map(function (result) {
            if (!result[0] && result[1]) {
                throw (result[1]);
            }
            return result[0];
        }));
    };
    AdalService.prototype.getUser = function () {
        var _this = this;
        return bindCallback(function (callback) {
            _this.context.getUser(function (error, user) {
                if (error) {
                    _this.context.error('Error when getting user', error);
                    callback(null);
                }
                else {
                    callback(user || null);
                }
            });
        })();
    };
    AdalService.prototype.clearCache = function () {
        this.context.clearCache();
    };
    AdalService.prototype.clearCacheForResource = function (resource) {
        this.context.clearCacheForResource(resource);
    };
    AdalService.prototype.info = function (message) {
        this.context.info(message);
    };
    AdalService.prototype.verbose = function (message) {
        this.context.verbose(message);
    };
    AdalService.prototype.getResourceForEndpoint = function (url) {
        return this.context.getResourceForEndpoint(url);
    };
    AdalService.prototype.refreshDataFromCache = function () {
        this.updateDataFromCache();
    };
    AdalService.prototype.updateDataFromCache = function () {
        var token = this.context.getCachedToken(this.context.config.loginResource);
        this.user.authenticated = token !== null && token.length > 0;
        var user = this.context.getCachedUser();
        if (user) {
            this.user.userName = user.userName;
            this.user.profile = user.profile;
            this.user.token = token;
            this.user.error = this.context.getLoginError();
            this.user.loginCached = true;
        }
        else {
            this.user.userName = '';
            this.user.profile = {};
            this.user.token = '';
            this.user.error = this.context.getLoginError();
            this.user.loginCached = false;
        }
    };
    AdalService.prototype.refreshLoginToken = function () {
        var _this = this;
        if (!this.user.loginCached)
            throw ("User not logged in");
        this.acquireToken(this.context.config.loginResource).subscribe(function (token) {
            _this.user.token = token;
            if (_this.user.authenticated == false) {
                _this.user.authenticated = true;
                _this.user.error = '';
                window.location.reload();
            }
            else {
                _this.setupLoginTokenRefreshTimer();
            }
        }, function (error) {
            _this.user.authenticated = false;
            _this.user.error = _this.context.getLoginError();
        });
    };
    AdalService.prototype.now = function () {
        return Math.round(new Date().getTime() / 1000.0);
    };
    Object.defineProperty(AdalService.prototype, "isInCallbackRedirectMode", {
        get: function () {
            return window.location.href.indexOf("#access_token") !== -1 || window.location.href.indexOf("#id_token") !== -1;
        },
        enumerable: true,
        configurable: true
    });
    ;
    AdalService.prototype.setupLoginTokenRefreshTimer = function () {
        // Get expiration of login token
        //         let exp = this.context._getItem(this.context.CONSTANTS.STORAGE.EXPIRATION_KEY + <any>this.context.config.loginResource);
        //         // Either wait until the refresh window is valid or refresh in 1 second (measured in seconds)
        //         let timerDelay = exp - this.now() - (this.context.config.expireOffsetSeconds || 300) > 0 ? exp - this.now() - (this.context.config.expireOffsetSeconds || 300) : 1;
        //         if (this.loginRefreshTimer) this.loginRefreshTimer.unsubscribe();
        //         this.ngZone.runOutsideAngular(() => {
        //             this.loginRefreshTimer = timer(timerDelay * 1000).subscribe((x) => {
        //                 this.refreshLoginToken()
        //             });
        //         });
        // fpt edit
        var _this = this;
        var exp = this.context._getItem(this.context.CONSTANTS.STORAGE.EXPIRATION_KEY + this.context.config.loginResource);
        var timerDelay = exp - this.now() - (this.context.config.expireOffsetSeconds || 300) > 0 ? exp - this.now() - (this.context.config.expireOffsetSeconds || 300) : 1;
        this.loginRefreshTimer = timerDelay * 1000;
    };
    AdalService.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */
    AdalService.ctorParameters = function () { return [
        { type: NgZone }
    ]; };
    return AdalService;
}());
export { AdalService };
//# sourceMappingURL=adal.service.js.map