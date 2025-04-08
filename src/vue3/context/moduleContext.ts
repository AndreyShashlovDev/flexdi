import { inject, InjectionKey, provide } from 'vue'
import { ModuleType } from '../../core'

export interface ModuleContextValue {
  moduleClass: ModuleType
}

export const MODULE_CONTEXT_KEY: InjectionKey<ModuleContextValue> = Symbol('ModuleContext')

export function provideModule(module: ModuleType): void {
  provide(MODULE_CONTEXT_KEY, {moduleClass: module})
}

export function injectModule(): ModuleContextValue {
  const context = inject(MODULE_CONTEXT_KEY)

  if (!context) {
    throw new Error('useModule must be used within a ModuleProvider')
  }

  return context
}
