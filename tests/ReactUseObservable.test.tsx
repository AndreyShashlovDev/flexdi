import { act, renderHook } from '@testing-library/react'
import { BehaviorSubject, Observable } from 'rxjs'
import { describe, expect, test } from 'vitest'
import { useObservable } from '../src/react'

function countingObservable<T>(subject: BehaviorSubject<T>, counter: { count: number }): Observable<T> {
  return new Observable<T>(subscriber => {
    counter.count++
    return subject.subscribe(subscriber)
  })
}

describe('useObservable resubscribe behavior', () => {
  test('without deps, resubscribes whenever the observable identity changes on re-render', () => {
    const subject = new BehaviorSubject('a')
    const counter = {count: 0}

    const {result, rerender} = renderHook(() => useObservable(countingObservable(subject, counter), 'a'))

    expect(counter.count).toBe(1)
    expect(result.current).toBe('a')

    rerender()
    rerender()

    expect(counter.count).toBe(3)
  })

  test('with deps, only resubscribes when those deps actually change', () => {
    const subject = new BehaviorSubject('a')
    const counter = {count: 0}
    const stableDep = {}

    const {result, rerender} = renderHook(
      () => useObservable(countingObservable(subject, counter), 'a', [stableDep])
    )

    expect(counter.count).toBe(1)

    rerender()
    rerender()

    expect(counter.count).toBe(1)

    act(() => {
      subject.next('b')
    })

    expect(result.current).toBe('b')
  })
})
