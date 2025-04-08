import { defineAsyncComponent, h } from 'vue'
import { ModuleType } from '../../core'
import { VueComponent } from '../components/InternalModuleLoader.vue'
import ModuleLoader from '../components/ModuleLoader.vue'

interface ModuleRouteParams {
  path: string
  name?: string
  module: ModuleType
  component: () => Promise<{ default: VueComponent }>
  loadingComponent: VueComponent
  errorComponent: VueComponent
  meta?: Record<string, unknown>
}

export function createModuleRoute({
  path,
  name,
  module,
  component,
  loadingComponent,
  errorComponent,
  meta = {}
}: ModuleRouteParams) {
  return {
    path,
    name,
    meta: {
      ...meta,
      module
    },
    component: {
      setup() {
        const AsyncComponent = defineAsyncComponent({
          loader: component,
          loadingComponent,
          errorComponent
        })

        return () => h(ModuleLoader, {
          module,
          loadingComponent,
          errorComponent,
        }, {
          default: () => h(AsyncComponent)
        })
      }
    }
  }
}
