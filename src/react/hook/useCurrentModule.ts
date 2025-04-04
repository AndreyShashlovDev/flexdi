import { useContext } from 'react'
import { ModuleType } from '../../core'
import { ModuleContext } from '../provider/ModuleContext'

export function useCurrentModule(): ModuleType {
  const context = useContext(ModuleContext)

  if (!context) {
    throw new Error('useCurrentModule must be used within ModuleProvider')
  }
  return context.moduleClass
}
