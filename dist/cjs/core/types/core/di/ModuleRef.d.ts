import { ModuleManager, ProviderRef } from './Dependency';
import { Abstract, InjectionToken, ModuleOptions, ModuleType } from './types';
export declare class ModuleRef {
    readonly options: ModuleOptions;
    readonly moduleClass: ModuleType;
    readonly isSingleton: boolean;
    private readonly moduleManagerInstance;
    providers: Map<string | symbol | Abstract<any>, ProviderRef>;
    imports: ModuleRef[];
    exports: Set<string | symbol | Abstract<any>>;
    initialized: boolean;
    initializing: boolean;
    rootModule: ModuleRef | null;
    instanceCache: Map<string | symbol | Abstract<any>, any>;
    constructor(options: ModuleOptions, moduleClass: ModuleType, isSingleton: boolean, moduleManagerInstance: ModuleManager);
    get name(): string;
    isExported(token: InjectionToken<unknown>): boolean;
    getLocalProvider(token: InjectionToken<unknown>): ProviderRef | null;
    resolveProvider(token: InjectionToken<unknown>): Promise<any>;
    initialize(rootModule?: ModuleRef | null): Promise<void>;
    private preInitializeExports;
    private registerProvider;
    dispose(): void;
}
