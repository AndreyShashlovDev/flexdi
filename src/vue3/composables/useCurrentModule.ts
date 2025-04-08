import { ModuleType } from '../../core'
import { injectModule } from '../context/moduleContext'

export function useCurrentModule(): ModuleType {
  const { moduleClass } = injectModule()
  return moduleClass
}
