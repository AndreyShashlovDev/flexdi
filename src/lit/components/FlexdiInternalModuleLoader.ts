import { ContextProvider } from '@lit/context'
import { html, LitElement } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ModuleManagerFactory, ModuleType, preloadModule } from '../../core'
import { moduleContext } from '../context/moduleContext'

export abstract class FlexdiInternalModuleLoader extends LitElement {
  @property({attribute: false}) declare module: ModuleType

  @state() private declare isLoading: boolean
  @state() private declare loadError: Error | null

  protected abstract readonly isRootModule: boolean

  private readonly provider = new ContextProvider(this, {context: moduleContext})

  constructor() {
    super()
    this.isLoading = true
    this.loadError = null
  }

  public connectedCallback(): void {
    super.connectedCallback()
    this.loadModule()
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback()
    ModuleManagerFactory.getInstance().unloadModule(this.module)
  }

  protected render() {
    if (this.isLoading) {
      return html`<slot name="loading"></slot>`
    }

    if (this.loadError) {
      return html`<slot name="error"></slot>`
    }

    return html`<slot></slot>`
  }

  private async loadModule(): Promise<void> {
    try {
      await preloadModule(this.module, this.isRootModule)
      this.provider.setValue({moduleClass: this.module})
    } catch (error) {
      console.error('Error loading module:', this.module.name, error)
      this.loadError = error instanceof Error ? error : new Error(String(error))
    } finally {
      this.isLoading = false
    }
  }
}
