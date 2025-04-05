import { ModuleManager } from './Dependency'

export class ModuleManagerFactory {

  private static _instance: ModuleManager = new ModuleManager()

  public static getInstance(): ModuleManager {
    return ModuleManagerFactory._instance
  }

  /**
   * ONLY FOR TEST AND DEBUG!!!
   * @param manager
   */
  public static setInstance(manager: ModuleManager): void {
    ModuleManagerFactory._instance = manager
  }

  /**
   * ONLY FOR TEST AND DEBUG!!!
   */
  public static resetInstance(): void {
    ModuleManagerFactory.setInstance(new ModuleManager())
  }
}
