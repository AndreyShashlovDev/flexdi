import React, { ComponentType, FC, ReactNode, Suspense } from 'react'
import { ModuleType } from '../../core'
import { ErrorBoundary, ErrorBoundaryProps } from '../component/ErrorBoundary'
import { ModuleGuard } from '../router/ModuleGuard'
import { ModuleContext } from './ModuleContext'

export let ENABLE_STRICT_MODE = false

export interface ModuleLoaderProps {
  module: ModuleType
  children?: ReactNode
  Component?: ComponentType<any>
  LoadingComponent: FC
  ErrorComponent: FC
  ErrorBoundary?: ComponentType<ErrorBoundaryProps>
}

export interface RootModuleLoaderProps extends ModuleLoaderProps {
  enableStrictMode: boolean
}

interface InternalModuleLoaderProps extends ModuleLoaderProps {
  isRootModule?: boolean,
}

export function RootModuleLoader({
  module,
  children,
  Component,
  ErrorBoundary,
  LoadingComponent,
  ErrorComponent,
  enableStrictMode,
}: RootModuleLoaderProps) {
  ENABLE_STRICT_MODE = enableStrictMode

  return InternalModuleLoader({
    module,
    children,
    Component,
    ErrorBoundary,
    LoadingComponent,
    ErrorComponent,
    isRootModule: true
  })
}

export function ModuleLoader({
  module,
  children,
  Component,
  ErrorBoundary,
  LoadingComponent,
  ErrorComponent,
}: ModuleLoaderProps) {
  return InternalModuleLoader({
    module,
    children,
    Component,
    ErrorBoundary,
    LoadingComponent,
    ErrorComponent,
    isRootModule: false
  })
}

function InternalModuleLoader({
  module,
  children,
  Component,
  ErrorBoundary: CustomErrorBoundary,
  LoadingComponent,
  ErrorComponent,
  isRootModule,
}: InternalModuleLoaderProps) {
  const BoundaryComponent = CustomErrorBoundary || ErrorBoundary
  const content = children || (Component ? <Component /> : null)

  return (
    <BoundaryComponent fallback={<ErrorComponent />}>
      <Suspense fallback={<LoadingComponent />}>
        <ModuleGuard
          module={module}
          LoadingComponent={LoadingComponent}
          ErrorComponent={ErrorComponent}
          isRootModule={isRootModule}
        >
          <ModuleContext.Provider value={{moduleClass: module}}>
          {content}
          </ModuleContext.Provider>
        </ModuleGuard>
      </Suspense>
    </BoundaryComponent>
  )
}
