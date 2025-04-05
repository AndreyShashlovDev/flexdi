import React, { ComponentType, FC, LazyExoticComponent } from 'react';
import { ModuleType } from '../../core';
import { ErrorBoundaryProps } from '../provider/ModuleLoader';
interface ModuleRouteParams {
    path: string;
    module: ModuleType;
    Component: LazyExoticComponent<ComponentType<unknown>>;
    ErrorBoundary: ComponentType<ErrorBoundaryProps>;
    LoadingComponent: FC;
    ErrorComponent: FC;
}
export declare function createModuleRoute({ path, module, Component, ErrorBoundary, LoadingComponent, ErrorComponent, }: ModuleRouteParams): {
    path: string;
    element: React.JSX.Element;
};
export {};
