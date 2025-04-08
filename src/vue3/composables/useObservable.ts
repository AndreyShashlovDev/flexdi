import { Observable } from 'rxjs'
import { onMounted, onUnmounted, ref, Ref } from 'vue'

export function useObservable<T>(observable: Observable<T>, initialValue: T): Ref<T> {
  const value = ref<T>(initialValue) as Ref<T>

  onMounted(() => {
    const subscription = observable.subscribe({
      next: (newValue) => {
        value.value = newValue
      }
    })
    
    onUnmounted(() => {
      subscription.unsubscribe()
    })
  })

  return value
}
