export interface Abstract<T> {
    prototype: T;
}
export type InjectionToken<T = any> = string | symbol | Abstract<T>;
type constructor<T = any> = new (...args: any[]) => T;
export interface ModuleType {
    new (...args: unknown[]): unknown;
}
export interface ModuleClassProvider<T = unknown> {
    provide: InjectionToken<T>;
    useClass: constructor<T>;
    scope?: Scope;
}
export interface ModuleValueProvider<T = unknown> {
    provide: InjectionToken<T>;
    useValue: T;
}
export interface ModuleFactoryProvider<T = unknown> {
    provide: InjectionToken<T>;
    useFactory: (...args: any[]) => T | Promise<T>;
    deps?: InjectionToken<unknown>[];
}
export interface ModuleTokenProvider<T = unknown, U = unknown> {
    provide: InjectionToken<T>;
    useToken: InjectionToken<U>;
}
export interface ModuleOptions {
    imports?: ModuleType[];
    providers?: ProviderOptions[];
    exports?: InjectionToken<unknown>[];
}
export type ProviderOptions = ModuleClassProvider | ModuleValueProvider | ModuleFactoryProvider | ModuleTokenProvider;
export declare enum Scope {
    SINGLETON = "SINGLETON",
    TRANSIENT = "TRANSIENT"
}
export {};
