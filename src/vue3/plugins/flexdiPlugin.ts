import { App } from 'vue'
import { vModuleGuard } from '../directives/vModuleGuard'

export const flexdiPlugin = {
  install(app: App) {
    app.directive('module-guard', vModuleGuard)
  }
}
