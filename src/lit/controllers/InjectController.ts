import { ReactiveControllerHost } from 'lit'
import { InjectionToken, ModuleManagerFactory } from '../../core'
import { CurrentModuleController } from '../context/CurrentModuleController'

export class InjectController<T> {
  private readonly currentModule: CurrentModuleController
  private resolved?: T
  private hasResolved = false

  constructor(host: ReactiveControllerHost, private readonly token: InjectionToken<T>) {
    this.currentModule = new CurrentModuleController(host)
  }

  public get isReady(): boolean {
    return this.currentModule.isReady
  }

  public get value(): T {
    if (!this.hasResolved) {
      const moduleClass = this.currentModule.moduleClass

      try {
        this.resolved = ModuleManagerFactory.getInstance().getService<T>(moduleClass, this.token)
        this.hasResolved = true
      } catch (error) {
        console.warn(`Could not resolve ${String(this.token)} from module ${moduleClass.name}`, error)
        throw error
      }
    }

    return this.resolved as T
  }
}
