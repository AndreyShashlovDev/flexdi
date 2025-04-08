import { Directive, DirectiveBinding } from 'vue'
import { ModuleManagerFactory, ModuleType, preloadModule } from '../../core'

export const vModuleGuard: Directive<HTMLElement, ModuleType> = {
  async mounted(el: HTMLElement, binding: DirectiveBinding<ModuleType>) {
    const module = binding.value

    try {
      await preloadModule(module, false)
      el.dataset.moduleLoaded = 'true'
    } catch (error) {
      console.error(`Error loading module ${module.name}:`, error)
      el.dataset.moduleError = String(error)
    }
  },

  unmounted(_: HTMLElement, binding: DirectiveBinding<ModuleType>) {
    const module = binding.value
    ModuleManagerFactory.getInstance().unloadModule(module)
  }
}
