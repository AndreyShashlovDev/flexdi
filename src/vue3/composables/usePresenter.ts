import { onMounted, onUnmounted } from 'vue'
import { BasicPresenter, InjectionToken, ModuleManagerFactory } from '../../core'
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
    presenter.init(args)
  })

  onUnmounted(() => {
    presenter.destroy()
  })

  return presenter
}
