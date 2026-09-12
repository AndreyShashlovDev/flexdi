import { waitFor } from '@testing-library/dom'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { BehaviorSubject, Observable } from 'rxjs'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  BasicPresenter, Inject, Injectable, Module, ModuleManager, ModuleManagerFactory
} from '../src/core'
import { InjectController, ObservableController, PresenterController } from '../src/lit'
import '../src/lit'

interface User {
  id: number
  name: string
}

abstract class UserService {
  abstract getUsers(): Observable<User[]>
}

@Injectable()
class MockUserService extends UserService {
  private users = new BehaviorSubject<User[]>([{id: 1, name: 'John Doe'}, {id: 2, name: 'Jane Smith'}])

  getUsers(): Observable<User[]> {
    return this.users.asObservable()
  }

  updateUsers(users: User[]): void {
    this.users.next(users)
  }
}

abstract class UserPresenter extends BasicPresenter<void> {
  abstract getUsers(): Observable<User[]>
}

@Injectable()
class UserPresenterImpl extends UserPresenter {
  private filtered = new BehaviorSubject<User[]>([])

  constructor(@Inject(UserService) private readonly userService: UserService) {
    super()
  }

  ready(): void {
    this.userService.getUsers().subscribe(users => this.filtered.next(users))
  }

  destroy(): void {
    this.filtered.complete()
  }

  getUsers(): Observable<User[]> {
    return this.filtered.asObservable()
  }
}

@Module({
  providers: [
    {provide: UserService, useClass: MockUserService},
    {provide: UserPresenter, useClass: UserPresenterImpl}
  ],
  exports: [UserService, UserPresenter]
})
class TestModule {}

@customElement('test-user-list')
class TestUserListElement extends LitElement {
  private readonly presenterCtrl = new PresenterController(this, UserPresenter)
  private readonly usersCtrl = new ObservableController(this, () => this.presenterCtrl.value.getUsers(), [] as User[])
  private readonly serviceCtrl = new InjectController(this, UserService)

  protected render() {
    if (!this.presenterCtrl.isReady || !this.serviceCtrl.isReady) {
      return html`<p data-testid="pending">Loading...</p>`
    }

    const users = this.usersCtrl.value

    if (users.length === 0) {
      return html`<p data-testid="empty">No users</p>`
    }

    return html`
      <ul data-testid="user-list">
        ${users.map(user => html`<li data-testid=${`user-${user.id}`}>${user.name}</li>`)}
      </ul>
    `
  }

  public getServiceViaInject(): UserService {
    return this.serviceCtrl.value
  }
}

describe('Lit integration', () => {
  let moduleManager: ModuleManager

  beforeEach(() => {
    ModuleManagerFactory.resetInstance()
    moduleManager = ModuleManagerFactory.getInstance()
    // Every test here loads its module as root and cleans up via removeChild(), which always
    // logs "Cannot unload root module" from that safety guard - expected noise, not a failure.
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('renders presenter-backed data and reacts to service updates', async () => {
    const loader = document.createElement('flexdi-root-module-loader') as any
    loader.module = TestModule
    const list = document.createElement('test-user-list') as TestUserListElement
    loader.appendChild(list)
    document.body.appendChild(loader)

    // Connects immediately, before the module is ready - render() must show a placeholder.
    await list.updateComplete
    expect(list.shadowRoot?.querySelector('[data-testid="pending"]')).toBeTruthy()

    await waitFor(() => {
      expect(list.shadowRoot?.querySelector('[data-testid="user-list"]')).toBeTruthy()
    })

    const mockUserService = moduleManager.getService<MockUserService>(TestModule, UserService)

    expect(list.shadowRoot?.querySelector('[data-testid="user-1"]')?.textContent).toBe('John Doe')
    expect(list.getServiceViaInject()).toBe(mockUserService)

    mockUserService.updateUsers([{id: 3, name: 'Bob Johnson'}])

    await waitFor(() => {
      expect(list.shadowRoot?.querySelector('[data-testid="user-3"]')?.textContent).toBe('Bob Johnson')
    })
    expect(list.shadowRoot?.querySelector('[data-testid="user-1"]')).toBeFalsy()

    document.body.removeChild(loader)
  })

  test('starts in the loading state synchronously, then settles on the default slot', async () => {
    const loader = document.createElement('flexdi-root-module-loader') as any
    loader.module = TestModule
    loader.appendChild(document.createElement('test-user-list'))

    document.body.appendChild(loader)

    expect(loader.isLoading).toBe(true)

    await waitFor(() => {
      expect(loader.shadowRoot?.querySelector('slot:not([name])')).toBeTruthy()
    })
    expect(loader.isLoading).toBe(false)
    expect(loader.loadError).toBeNull()

    document.body.removeChild(loader)
  })

  test('shows the error slot when the module fails to load, and descendants never become ready', async () => {
    @Module({
      providers: [{provide: 'MissingDep', useFactory: () => {
        throw new Error('boom')
      }}],
      exports: ['MissingDep']
    })
    class BrokenModule {}

    const loader = document.createElement('flexdi-root-module-loader') as any
    loader.module = BrokenModule

    const errorSlot = document.createElement('div')
    errorSlot.slot = 'error'
    errorSlot.textContent = 'Failed to load'
    loader.appendChild(errorSlot)

    const list = document.createElement('test-user-list') as TestUserListElement
    loader.appendChild(list)

    // The failure path deliberately logs (Dependency.ts + FlexdiInternalModuleLoader.ts) so a
    // real app's console shows why loading failed - expected noise here, so silence it.
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    document.body.appendChild(loader)

    await waitFor(() => {
      expect(loader.shadowRoot?.querySelector('slot[name="error"]')).toBeTruthy()
    })
    expect(loader.shadowRoot?.querySelector('slot:not([name])')).toBeFalsy()
    expect(list.shadowRoot?.querySelector('[data-testid="pending"]')).toBeTruthy()
    expect(consoleErrorSpy).toHaveBeenCalled()

    document.body.removeChild(loader)
  })

  test('a presenter shared by two elements is not torn down while one of them is still connected', async () => {
    const loader = document.createElement('flexdi-root-module-loader') as any
    loader.module = TestModule

    const listA = document.createElement('test-user-list') as TestUserListElement
    const listB = document.createElement('test-user-list') as TestUserListElement
    loader.appendChild(listA)
    loader.appendChild(listB)
    document.body.appendChild(loader)

    await waitFor(() => {
      expect(listA.shadowRoot?.querySelector('[data-testid="user-list"]')).toBeTruthy()
      expect(listB.shadowRoot?.querySelector('[data-testid="user-list"]')).toBeTruthy()
    })

    const mockUserService = moduleManager.getService<MockUserService>(TestModule, UserService)

    loader.removeChild(listA)

    mockUserService.updateUsers([{id: 4, name: 'Alice'}])

    await waitFor(() => {
      expect(listB.shadowRoot?.querySelector('[data-testid="user-4"]')?.textContent).toBe('Alice')
    })

    document.body.removeChild(loader)
    expect(console.warn).toHaveBeenCalledWith('Cannot unload root module')
  })
})
