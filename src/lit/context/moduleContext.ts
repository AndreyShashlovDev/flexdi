import { createContext } from '@lit/context'
import { ModuleType } from '../../core'

export interface ModuleContextValue {
  moduleClass: ModuleType
}

export const moduleContext = createContext<ModuleContextValue>(Symbol.for('flexdi.module-context'))
