export abstract class BasicPresenter<InitArgs> {

  protected args?: InitArgs

  public init(args?: InitArgs): void {
    this.args = args
    this.ready(args)
  }

  public abstract ready(args?: InitArgs): void

  public abstract destroy(): void
}
