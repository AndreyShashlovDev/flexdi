import { ReactiveController, ReactiveControllerHost } from 'lit'
import { Observable, Subscription } from 'rxjs'
import { CurrentModuleController } from '../context/CurrentModuleController'

export class ObservableController<T> implements ReactiveController {
  private subscription?: Subscription
  private current: T

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly source: () => Observable<T>,
    initialValue: T
  ) {
    this.current = initialValue
    new CurrentModuleController(host, () => this.subscribe())
    host.addController(this)
  }

  public get value(): T {
    return this.current
  }

  public hostDisconnected(): void {
    this.subscription?.unsubscribe()
    this.subscription = undefined
  }

  private subscribe(): void {
    if (this.subscription) {
      return
    }

    this.subscription = this.source().subscribe(value => {
      this.current = value
      this.host.requestUpdate()
    })
  }
}
