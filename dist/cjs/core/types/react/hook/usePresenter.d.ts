import { BasicPresenter, InjectionToken } from '../../core';
export declare function usePresenter<T extends BasicPresenter<A>, A>(presenterToken: InjectionToken<T>, args?: A): T;
