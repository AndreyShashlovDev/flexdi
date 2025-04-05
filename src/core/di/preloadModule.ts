import { ModuleManagerFactory } from './ModuleManagerFactory'
import { ModuleType } from './types'

export const preloadModule = async (moduleClass: ModuleType, isRootModule: boolean): Promise<void> => {
  await ModuleManagerFactory.getInstance().loadModule(moduleClass, isRootModule)
}
