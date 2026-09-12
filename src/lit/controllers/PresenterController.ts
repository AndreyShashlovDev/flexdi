import { ReactiveController, ReactiveControllerHost } from 'lit'
import { acquirePresenter, BasicPresenter, InjectionToken, ModuleManagerFactory, ModuleType, releasePresenter } from '../../core'
import { CurrentModuleController } from '../context/CurrentModuleController'

export class PresenterController<T extends BasicPresenter<A>, A> implements ReactiveController {
  private presenter?: T

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly token: InjectionToken<T>,
    private readonly args?: A
  ) {
    new CurrentModuleController(host, moduleClass => this.resolve(moduleClass))
    host.addController(this)
  }

  public get isReady(): boolean {
    return !!this.presenter
  }

  public get value(): T {
    if (!this.presenter) {
      throw new Error(
        `Presenter ${String(this.token)} is not ready yet - check .isReady before reading this.`
      )
    }

    return this.presenter
  }

  public hostDisconnected(): void {
    if (this.presenter) {
      releasePresenter(this.presenter)
    }
  }

  private resolve(moduleClass: ModuleType): void {
    if (this.presenter) {
      return
    }

    try {
      this.presenter = ModuleManagerFactory.getInstance().getService<T>(moduleClass, this.token)
    } catch (error) {
      console.warn(`Could not resolve presenter ${String(this.token)} from module ${moduleClass.name}`, error)
      throw error
    }

    acquirePresenter(this.presenter, this.args)
    this.host.requestUpdate()
  }
}
