import { ReactNode } from 'react';
import { ModuleType } from '../../core';
interface ModuleProviderProps {
    module: ModuleType;
    children: ReactNode;
}
export declare const ModuleProvider: ({ module, children }: ModuleProviderProps) => JSX.Element;
export {};
