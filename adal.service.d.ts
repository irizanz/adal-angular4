/// <reference path="./adal-angular.d.ts" />
import { NgZone } from '@angular/core';
import { Observable } from 'rxjs';
export declare class AdalService {
    private ngZone;
    private context;
    private loginRefreshTimer;
    private user;
    constructor(ngZone: NgZone);
    init(configOptions: adal.Config): void;
    readonly config: adal.Config;
    readonly userInfo: adal.User;
    login(): void;
    loginInProgress(): boolean;
    logOut(): void;
    handleWindowCallback(removeHash?: boolean): void;
    getCachedToken(resource: string): string | null;
    acquireToken(resource: string): Observable<string | null>;
    getUser(): Observable<adal.User | null>;
    clearCache(): void;
    clearCacheForResource(resource: string): void;
    info(message: string): void;
    verbose(message: string): void;
    getResourceForEndpoint(url: string): string | null;
    refreshDataFromCache(): void;
    private updateDataFromCache();
    private refreshLoginToken();
    private now();
    private readonly isInCallbackRedirectMode;
    private setupLoginTokenRefreshTimer();
}
