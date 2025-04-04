export declare abstract class BasicPresenter<InitArgs> {
    protected args?: InitArgs;
    init(args?: InitArgs): void;
    abstract ready(args?: InitArgs): void;
    abstract destroy(): void;
}
