import { useLayoutEffect, useMemo, useRef } from 'react'
import { BasicPresenter, InjectionToken, ModuleManagerFactory } from '../../core'
import { ENABLE_STRICT_MODE } from '../provider'
import { useCurrentModule } from './useCurrentModule'

export function usePresenter<T extends BasicPresenter<A>, A>(
  presenterToken: InjectionToken<T>,
  args?: A
): T {
  const moduleClass = useCurrentModule()
  const isFirstInit = useRef(false)
  const indexForStrictMode = useRef(0)
  const strictCallsCount = useMemo(() => ENABLE_STRICT_MODE ? 2 : 1, [ENABLE_STRICT_MODE])

  const presenter = useMemo(() => {
    try {
      return ModuleManagerFactory.getInstance().getService<T>(moduleClass, presenterToken)
    } catch (error) {
      console.warn(
        `Could not resolve presenter ${String(presenterToken)} from module ${moduleClass.name}, trying root container...`,
        error
      )
      throw error
    }
  }, [moduleClass, presenterToken])

  useLayoutEffect(() => {
    indexForStrictMode.current++
    const index = indexForStrictMode.current

    // In StrictMode it is called twice, in Production once
    if (index === strictCallsCount || isFirstInit.current) {
      presenter.init(args)
      isFirstInit.current = true
    }

    return () => {
      if (index === strictCallsCount || isFirstInit.current) {
        presenter.destroy()
        indexForStrictMode.current = 0
      }
    }
  }, [presenter, presenterToken, JSON.stringify(args), moduleClass])

  return presenter
}
