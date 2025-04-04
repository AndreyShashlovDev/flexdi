import { moduleManager } from './Dependency'
import { ModuleType } from './types'

export const preloadModule = async (moduleClass: ModuleType, isRootModule: boolean): Promise<void> => {
  await moduleManager.loadModule(moduleClass, isRootModule)
}
