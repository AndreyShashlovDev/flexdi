import { ModuleManager } from './Dependency';
export declare class ModuleManagerFactory {
    private static _instance;
    static getInstance(): ModuleManager;
    /**
     * ONLY FOR TEST AND DEBUG!!!
     * @param manager
     */
    static setInstance(manager: ModuleManager): void;
    /**
     * ONLY FOR TEST AND DEBUG!!!
     */
    static resetInstance(): void;
}
