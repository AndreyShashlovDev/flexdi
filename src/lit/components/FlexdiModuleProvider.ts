import { ContextProvider } from '@lit/context'
import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { ModuleManagerFactory, ModuleType } from '../../core'
import { moduleContext } from '../context/moduleContext'

export class FlexdiModuleProvider extends LitElement {
  @property({attribute: false}) declare module: ModuleType

  private readonly provider = new ContextProvider(this, {context: moduleContext})

  public connectedCallback(): void {
    super.connectedCallback()
    this.loadModule()
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback()
    ModuleManagerFactory.getInstance().unloadModule(this.module)
  }

  protected render() {
    return html`<slot></slot>`
  }

  private async loadModule(): Promise<void> {
    const moduleManager = ModuleManagerFactory.getInstance()

    try {
      if (!moduleManager.isModuleLoaded(this.module)) {
        await moduleManager.loadModule(this.module)
      }
    } catch (error) {
      console.error(`Error loading module ${this.module.name}:`, error)
      return
    }

    this.provider.setValue({moduleClass: this.module})
  }
}

customElements.define('flexdi-module-provider', FlexdiModuleProvider)
