import { BasicPresenter } from './BasicPresenter'

interface PresenterLifecycleEntry {
  count: number
}

const refCounts = new WeakMap<BasicPresenter<any>, PresenterLifecycleEntry>()

export function acquirePresenter<A>(presenter: BasicPresenter<A>, args?: A): void {
  let entry = refCounts.get(presenter)

  if (!entry) {
    entry = {count: 0}
    refCounts.set(presenter, entry)
  }

  entry.count++

  if (entry.count === 1) {
    presenter.init(args)
  }
}

export function releasePresenter(presenter: BasicPresenter<any>): void {
  const entry = refCounts.get(presenter)

  if (!entry) {
    return
  }

  entry.count--

  if (entry.count <= 0) {
    refCounts.delete(presenter)
    presenter.destroy()
  }
}
