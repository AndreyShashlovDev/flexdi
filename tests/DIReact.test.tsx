import { act, render, screen, waitFor } from '@testing-library/react'
import React, { useLayoutEffect, useRef } from 'react'
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { BasicPresenter, Inject, Injectable, Module, ModuleManager, ModuleManagerFactory, } from '../src/core'
import '@testing-library/jest-dom'
import { ModuleProvider, useInject, useObservable, usePresenter } from '../src/react'

interface User {
  id: number;
  name: string;
  email: string;
}

abstract class UserService {
  abstract getUsers(): Observable<User[]>;
}

@Injectable()
class MockUserService extends UserService {
  private users = new BehaviorSubject<User[]>([
    {id: 1, name: 'John Doe', email: 'john@example.com'},
    {id: 2, name: 'Jane Smith', email: 'jane@example.com'}
  ])

  getUsers(): Observable<User[]> {
    return this.users.asObservable()
  }

  updateUsers(users: User[]): void {
    this.users.next(users)
  }
}

@Injectable()
class UserPresenter extends BasicPresenter<void> {
  private filteredUsers = new BehaviorSubject<User[]>([])

  constructor(@Inject(UserService) private userService: UserService) {
    super()
  }

  ready(): void {
    this.userService.getUsers().subscribe(users => {
      this.filteredUsers.next(users)
    })
  }

  destroy(): void {
    this.filteredUsers.complete()
  }

  getUsers(): Observable<User[]> {
    return this.filteredUsers.asObservable()
  }

  filterUsersByName(query: string): void {
    this.userService.getUsers().subscribe(users => {
      if (!query) {
        this.filteredUsers.next(users)
        return
      }

      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(query.toLowerCase())
      )
      this.filteredUsers.next(filtered)
    })
  }
}

@Module({
  providers: [
    {provide: UserService, useClass: MockUserService},
    {provide: UserPresenter, useClass: UserPresenter}
  ],
  exports: [UserService, UserPresenter]
})
class TestModule {}

function UserList() {
  const presenter = usePresenter(UserPresenter)
  const userService = useInject(UserService)
  const users = useObservable(presenter.getUsers(), [])
  const destroySubject = useRef(new Subject<void>())

  const totalUsers = React.useMemo(() => {
    let count = 0
    userService.getUsers()
      .pipe(takeUntil(destroySubject.current))
      .subscribe(users => {
        count = users.length
      })
    return count
  }, [userService, destroySubject.current])

  useLayoutEffect(() => {
    return () => {
      destroySubject.current.next()
      destroySubject.current.complete()
    }
  }, [destroySubject.current])

  return (
    <div>
      <h1>User List</h1>
      <p data-testid='user-count-presenter'>Total users in presenter: {users.length}</p>
      <p data-testid='user-count-service'>Total users in service: {totalUsers}</p>
      {users.length === 0 ? (
        <p data-testid='empty-message'>No users found</p>
      ) : (
        <ul data-testid='user-list'>
          {users.map(user => (
            <li key={user.id} data-testid={`user-${user.id}`}>
              <strong>{user.name}</strong> ({user.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TestApp() {
  return (
    <ModuleProvider module={TestModule}>
      <UserList />
    </ModuleProvider>
  )
}

describe('UserList Component with DI', () => {
  let testModuleManager: ModuleManager
  let mockUserService: MockUserService

  beforeEach(async () => {
    ModuleManagerFactory.resetInstance()
    testModuleManager = ModuleManagerFactory.getInstance()
    await testModuleManager.loadModule(TestModule, true)

    mockUserService = testModuleManager.getService<MockUserService>(TestModule, UserService)
  })

  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeAll(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterAll(() => {
    consoleWarnSpy.mockRestore()
  })

  it('renders the user list correctly', async () => {
    render(<TestApp />)

    expect(screen.getByText('User List')).toBeInTheDocument()

    const userCountPresenter = screen.getByTestId('user-count-presenter')
    expect(userCountPresenter).toBeInTheDocument()
    expect(userCountPresenter).toHaveTextContent(/Total users in presenter/)

    const userCountService = screen.getByTestId('user-count-service')
    expect(userCountService).toBeInTheDocument()
    expect(userCountService).toHaveTextContent(/Total users in service/)

    await waitFor(() => {
      expect(screen.getByTestId('user-list')).toBeInTheDocument()
    })

    expect(screen.getByTestId('user-1')).toBeInTheDocument()
    expect(screen.getByTestId('user-2')).toBeInTheDocument()

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText(/jane@example.com/)).toBeInTheDocument()
  })

  it('shows empty message when no users', async () => {
    mockUserService.updateUsers([])

    render(<TestApp />)

    await waitFor(() => {
      expect(screen.getByTestId('empty-message')).toBeInTheDocument()
    })
    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('updates when user service changes', async () => {
    render(<TestApp />)

    await waitFor(() => {
      expect(screen.getByTestId('user-list')).toBeInTheDocument()
    })
    expect(screen.getByText('John Doe')).toBeInTheDocument()

    const newUsers = [
      {id: 3, name: 'Bob Johnson', email: 'bob@example.com'}
    ]
    act(() => {
      mockUserService.updateUsers(newUsers)
    })

    await waitFor(() => {
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })
})

describe('ModuleProvider used standalone (not inside a Loader/Guard)', () => {
  it('unloads its module on unmount, same as ModuleLoader/ModuleGuard already do', async () => {
    @Injectable()
    class FeatureService {
      public getValue(): string {
        return 'feature value'
      }
    }

    @Module({
      providers: [{provide: FeatureService, useClass: FeatureService}],
      exports: [FeatureService]
    })
    class FeatureModule {}

    ModuleManagerFactory.resetInstance()
    const manager = ModuleManagerFactory.getInstance()
    await manager.loadModule(FeatureModule)

    function FeatureComponent() {
      const service = useInject(FeatureService)
      return <div data-testid="feature-value">{service.getValue()}</div>
    }

    const {unmount} = render(
      <ModuleProvider module={FeatureModule}>
        <FeatureComponent />
      </ModuleProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('feature-value')).toHaveTextContent('feature value')
    })
    expect(manager.isModuleLoaded(FeatureModule)).toBe(true)

    unmount()

    expect(manager.isModuleLoaded(FeatureModule)).toBe(false)
  })
})
