import { createContext } from 'react'
import { ModuleType } from '../../core'

interface ModuleContextValue {
  moduleClass: ModuleType
}

export const ModuleContext = createContext<ModuleContextValue | null>(null)
