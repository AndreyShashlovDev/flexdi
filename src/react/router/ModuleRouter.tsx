import React, { ComponentType, FC, LazyExoticComponent, Suspense } from 'react'
import { ModuleType } from '../../core'
import { ErrorBoundaryProps } from '../provider/ModuleLoader'
import { ModuleProvider } from '../provider/ModuleProvider'
import { ModuleGuard } from './ModuleGuard'

interface ModuleRouteParams {
  path: string
  module: ModuleType
  Component: LazyExoticComponent<ComponentType<unknown>>
  ErrorBoundary: ComponentType<ErrorBoundaryProps>
  LoadingComponent: FC
  ErrorComponent: FC
}

export function createModuleRoute({
    path,
    module,
    Component,
    ErrorBoundary,
    LoadingComponent,
    ErrorComponent,
  }: ModuleRouteParams
) {
  return {
    path,
    element: (
      <ErrorBoundary fallback={<ErrorComponent />}>
        <Suspense fallback={<LoadingComponent />}>
          <ModuleGuard
            key={path}
            module={module}
            LoadingComponent={LoadingComponent}
            ErrorComponent={ErrorComponent}
            isRootModule={false}
          >
            <ModuleProvider module={module}>
              <Component />
            </ModuleProvider>
          </ModuleGuard>
        </Suspense>
      </ErrorBoundary>
    )
  }
}
