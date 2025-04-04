import { useMemo } from 'react'
import { InjectionToken, moduleManager } from '../../core'
import { useCurrentModule } from './useCurrentModule'

export function useInject<T>(token: InjectionToken<T>): T {
  const moduleClass = useCurrentModule()

  return useMemo(() => moduleManager.getService<T>(moduleClass, token), [moduleClass, token])
}
