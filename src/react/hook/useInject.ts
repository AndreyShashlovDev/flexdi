import { useMemo } from 'react'
import { InjectionToken, ModuleManagerFactory } from '../../core'
import { useCurrentModule } from './useCurrentModule'

export function useInject<T>(token: InjectionToken<T>): T {
  const moduleClass = useCurrentModule()

  return useMemo(() => ModuleManagerFactory.getInstance().getService<T>(moduleClass, token), [moduleClass, token])
}
