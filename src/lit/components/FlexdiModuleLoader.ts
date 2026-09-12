import { FlexdiInternalModuleLoader } from './FlexdiInternalModuleLoader'

export class FlexdiModuleLoader extends FlexdiInternalModuleLoader {
  protected readonly isRootModule = false
}

customElements.define('flexdi-module-loader', FlexdiModuleLoader)
