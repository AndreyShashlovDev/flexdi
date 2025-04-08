import { InjectionToken, ModuleManagerFactory } from '../../core'
import { useCurrentModule } from './useCurrentModule'

export function useInject<T>(token: InjectionToken<T>): T {
  const moduleClass = useCurrentModule()

  try {
    return ModuleManagerFactory.getInstance().getService<T>(moduleClass, token)
  } catch (error) {
    console.warn(
      `Could not resolve ${String(token)} from module ${moduleClass.name}...`,
      error
    )
    throw error
  }
}
