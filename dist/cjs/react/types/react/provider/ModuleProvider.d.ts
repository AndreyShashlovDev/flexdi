import React, { ReactNode } from 'react';
import { ModuleType } from '../../core';
interface ModuleProviderProps {
    module: ModuleType;
    children: ReactNode;
}
export declare const ModuleProvider: ({ module, children }: ModuleProviderProps) => React.JSX.Element;
export {};
