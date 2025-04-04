import { InjectionToken, ModuleOptions, Scope } from '../di';
export declare function Module(options: ModuleOptions): ClassDecorator;
export declare function Injectable(scope?: Scope): ClassDecorator;
export declare function Inject(token: InjectionToken<unknown>): ParameterDecorator;
export declare function Singleton(): ClassDecorator;
