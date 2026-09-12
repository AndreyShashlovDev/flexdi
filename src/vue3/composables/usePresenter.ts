import { onMounted, onUnmounted } from 'vue'
import { acquirePresenter, BasicPresenter, InjectionToken, ModuleManagerFactory, releasePresenter } from '../../core'
import { useCurrentModule } from './useCurrentModule'

export function usePresenter<T extends BasicPresenter<A>, A>(
  presenterToken: InjectionToken<T>,
  args?: A
): T {
  const moduleClass = useCurrentModule()
  let presenter: T

  try {
    presenter = ModuleManagerFactory.getInstance().getService<T>(moduleClass, presenterToken)
  } catch (error) {
    console.warn(
      `Could not resolve presenter ${String(presenterToken)} from module ${moduleClass.name}, trying root container...`,
      error
    )
    throw error
  }

  onMounted(() => {
    acquirePresenter(presenter, args)
  })

  onUnmounted(() => {
    releasePresenter(presenter)
  })

  return presenter
}
