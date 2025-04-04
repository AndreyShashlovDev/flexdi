import React, { ComponentType, FC, ReactNode, Suspense } from 'react'
import { ModuleType } from '../../core'
import { ModuleGuard } from '../router/ModuleGuard'
import { ModuleContext } from './ModuleContext'

export let ENABLE_STRICT_MODE = false

export interface ErrorBoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

export interface ModuleLoaderProps {
  module: ModuleType
  children: ReactNode
  ErrorBoundary: ComponentType<ErrorBoundaryProps>
  LoadingComponent: FC
  ErrorComponent: FC
}

export interface RootModuleLoader extends ModuleLoaderProps {
  enableStrictMode: boolean
}

interface InternalModuleLoaderProps extends ModuleLoaderProps {
  isRootModule?: boolean,
}

export function RootModuleLoader({
  module,
  children,
  ErrorBoundary,
  LoadingComponent,
  ErrorComponent,
  enableStrictMode,
}: RootModuleLoader) {
  ENABLE_STRICT_MODE = enableStrictMode

  return InternalModuleLoader({module, children, ErrorBoundary, LoadingComponent, ErrorComponent, isRootModule: true})
}

export function ModuleLoader({
  module,
  children,
  ErrorBoundary,
  LoadingComponent,
  ErrorComponent,
}: ModuleLoaderProps) {
  return InternalModuleLoader({module, children, ErrorBoundary, LoadingComponent, ErrorComponent, isRootModule: false})
}

function InternalModuleLoader({
  module,
  children,
  ErrorBoundary,
  LoadingComponent,
  ErrorComponent,
  isRootModule,
}: InternalModuleLoaderProps) {
  return (
    <ErrorBoundary fallback={<ErrorComponent />}>
      <Suspense fallback={<LoadingComponent />}>
        <ModuleGuard
          module={module}
          LoadingComponent={LoadingComponent}
          ErrorComponent={ErrorComponent}
          isRootModule={isRootModule}
        >
          <ModuleContext.Provider value={{moduleClass: module}}>
          {children}
          </ModuleContext.Provider>
        </ModuleGuard>
      </Suspense>
    </ErrorBoundary>
  )
}
