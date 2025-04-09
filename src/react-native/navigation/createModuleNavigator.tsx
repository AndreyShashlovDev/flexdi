import React, { ComponentType, FC } from 'react'
import { ModuleType } from '../../core'
import { ErrorBoundaryProps } from '../../react'
import { createModuleScreen } from './createModuleScreen'

export type NavigatorType = 'stack' | 'tab' | 'drawer' | 'bottom-tab' | 'material-bottom-tab' | 'material-top-tab'

export interface ErrorComponentProps {
  error?: Error
}

export interface ScreenConfig {
  name: string
  Component: React.ComponentType<any>
  module: ModuleType
  options?: Record<string, unknown>
}

export interface NavigatorConfig {
  type: NavigatorType
  screens: ScreenConfig[]
  defaultScreenOptions?: Record<string, unknown>
  navigatorOptions?: Record<string, unknown>
  LoadingComponent: FC
  ErrorComponent: FC<ErrorComponentProps>
  ErrorBoundary?: ComponentType<ErrorBoundaryProps>
}

export function createModuleNavigator({
  type,
  screens,
  defaultScreenOptions = {},
  navigatorOptions = {},
  LoadingComponent,
  ErrorComponent,
  ErrorBoundary
}: NavigatorConfig) {
  const moduleScreens = screens.map(screen => ({
    name: screen.name,
    component: createModuleScreen({
      module: screen.module,
      Component: screen.Component,
      LoadingComponent,
      ErrorComponent,
      ErrorBoundary,
      navigationOptions: {...defaultScreenOptions, ...screen.options}
    })
  }))

  // Возвращаем конфигурацию для навигатора
  return {
    type,
    screens: moduleScreens,
    navigatorOptions
  }
}
