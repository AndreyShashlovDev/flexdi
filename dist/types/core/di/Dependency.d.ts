import 'reflect-metadata';
import { ModuleRef } from './ModuleRef';
import { Abstract, InjectionToken, ModuleOptions, ModuleType, Scope } from './types';
export declare const INJECT_METADATA_KEY: unique symbol;
export declare const INJECTABLE_METADATA_KEY: unique symbol;
export declare const MODULE_METADATA_KEY: unique symbol;
export declare const SCOPE_METADATA_KEY: unique symbol;
export declare const SINGLETON_MODULE_METADATA_KEY: unique symbol;
export declare function getModuleOptions(moduleClass: ModuleType): ModuleOptions;
export declare function isSingletonModule(targetClass: ModuleType): boolean;
export declare const getTokenDebugName: (token: InjectionToken<unknown>) => string;
export declare const getTokenName: (token: InjectionToken<unknown>) => string | symbol | Abstract<any>;
export declare class ProviderRef {
    readonly token: string | symbol | Abstract<any>;
    type: 'class' | 'value' | 'factory' | 'token';
    readonly moduleRef: ModuleRef;
    instance: any;
    factory: ((...args: any[]) => any | Promise<any>) | null;
    dependencies: (string | symbol | Abstract<any>)[];
    scope: Scope;
    sourceModule: string;
    constructor(token: string | symbol | Abstract<any>, type: 'class' | 'value' | 'factory' | 'token', moduleRef: ModuleRef);
    resolve(): Promise<any>;
    dispose(): void;
}
export declare class ModuleManager {
    private moduleRefs;
    private singletonModuleRefs;
    private rootModuleRef;
    private moduleImports;
    private initializationPromises;
    registerModule(moduleClass: ModuleType, moduleRef: ModuleRef): void;
    isRootModule(moduleClass: ModuleType): boolean;
    findParentModules(moduleClass: ModuleType): ModuleType[];
    getLoadedModule(moduleClass: ModuleType): ModuleRef | null;
    isModuleLoaded(moduleClass: ModuleType): boolean;
    loadModule<T>(moduleClass: ModuleType, isRootModule?: boolean): Promise<T>;
    getService<T>(moduleClass: ModuleType, token: InjectionToken<unknown>): T;
    unloadModule(moduleClass: ModuleType): void;
    private findDependentModules;
}
