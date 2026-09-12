import { DependencyList, useEffect, useState } from 'react'
import { Observable } from 'rxjs'

export function useObservable<T>(observable: Observable<T>, initialValue: T, deps?: DependencyList): T {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    const subscription = observable.subscribe({
      next: setValue,
    })

    return () => subscription.unsubscribe()
  }, deps ?? [observable])

  return value
}
