# FlexDI + Lit example

A minimal, runnable demo of `flexdi/lit`: a module (`app.module.ts`) with a service and a
presenter, and a `<user-list>` custom element (`user-list.element.ts`) that consumes them through
`PresenterController`/`ObservableController`/`InjectController`, wrapped in
`<flexdi-root-module-loader>` (`main.ts`).

It imports the library from `../../src`, not from `flexdi`/`flexdi/lit` - this runs against the
current state of the repository directly, without needing a build first.

## Running it

From the repository root:

```bash
yarn demo:lit
```

Then open the printed local URL. Click "Add user" to see the presenter-backed list update.
