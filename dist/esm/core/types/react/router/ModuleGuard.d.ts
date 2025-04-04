import { FC, ReactNode } from 'react';
import { ModuleType } from '../../core';
interface ModuleGuardParams {
    module: ModuleType;
    children: ReactNode;
    LoadingComponent: FC;
    ErrorComponent: FC;
    isRootModule?: boolean;
}
export declare const ModuleGuard: ({ module, children, LoadingComponent, ErrorComponent, isRootModule, }: ModuleGuardParams) => JSX.Element;
export {};
