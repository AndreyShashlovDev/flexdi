import React from 'react'
import { ModuleLoader, ModuleLoaderProps, ModuleProvider } from '../../react'

export interface ModuleScreenParams extends Omit<ModuleLoaderProps, 'Component'> {
  Component: React.ComponentType<any>
  navigationOptions?: Record<string, any>
}

export function createModuleScreen({
  module,
  Component,
  LoadingComponent,
  ErrorComponent,
  ErrorBoundary,
  navigationOptions = {}
}: ModuleScreenParams) {
  const ScreenComponent = (props: any) => (
    <ModuleLoader
      module={module}
      LoadingComponent={LoadingComponent}
      ErrorComponent={ErrorComponent}
      ErrorBoundary={ErrorBoundary}
    >
      <ModuleProvider module={module}>
        <Component {...props} />
      </ModuleProvider>
    </ModuleLoader>
  )

  ScreenComponent.navigationOptions = navigationOptions

  return ScreenComponent
}
