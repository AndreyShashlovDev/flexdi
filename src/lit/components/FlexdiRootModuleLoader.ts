import { FlexdiInternalModuleLoader } from './FlexdiInternalModuleLoader'

export class FlexdiRootModuleLoader extends FlexdiInternalModuleLoader {
  protected readonly isRootModule = true
}

customElements.define('flexdi-root-module-loader', FlexdiRootModuleLoader)
