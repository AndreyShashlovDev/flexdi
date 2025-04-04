import { ComponentType, FC, ReactNode } from 'react';
import { ModuleType } from '../../core';
export declare let ENABLE_STRICT_MODE: boolean;
export interface ErrorBoundaryProps {
    fallback: ReactNode;
    children: ReactNode;
}
export interface ModuleLoaderProps {
    module: ModuleType;
    children: ReactNode;
    ErrorBoundary: ComponentType<ErrorBoundaryProps>;
    LoadingComponent: FC;
    ErrorComponent: FC;
}
export interface RootModuleLoader extends ModuleLoaderProps {
    enableStrictMode: boolean;
}
export declare function RootModuleLoader({ module, children, ErrorBoundary, LoadingComponent, ErrorComponent, enableStrictMode, }: RootModuleLoader): JSX.Element;
export declare function ModuleLoader({ module, children, ErrorBoundary, LoadingComponent, ErrorComponent, }: ModuleLoaderProps): JSX.Element;
