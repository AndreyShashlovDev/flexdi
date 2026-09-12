import { ContextConsumer } from '@lit/context'
import { ReactiveControllerHost } from 'lit'
import { ModuleType } from '../../core'
import { moduleContext } from './moduleContext'

export class CurrentModuleController {
  private readonly consumer: ContextConsumer<typeof moduleContext, ReactiveControllerHost>

  constructor(host: ReactiveControllerHost, onReady?: (moduleClass: ModuleType) => void) {
    this.consumer = new ContextConsumer(host, {
      context: moduleContext,
      subscribe: true,
      callback: value => {
        if (value) {
          onReady?.(value.moduleClass)
        }
      }
    })
  }

  public get isReady(): boolean {
    return !!this.consumer.value
  }

  public get moduleClass(): ModuleType {
    if (!this.consumer.value) {
      throw new Error(
        'The FlexDI module for this element is not ready yet (or this element is not inside a ' +
        '<flexdi-module-provider>/<flexdi-module-loader>/<flexdi-root-module-loader>) - check ' +
        '.isReady before reading this.'
      )
    }

    return this.consumer.value.moduleClass
  }
}
