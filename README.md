# FlexDI

A flexible, efficient, and lightweight dependency injection library for <b>React / React Native / Vue3</b> applications.

The library is inspired by the principles and architectural approach of NestJS and Angular, but adapted for frontend applications.

FlexDI allows you to organize a modular architecture with separation of concerns, component lifecycle management, and clear separation of business logic from presentation.

> **Note:** This is the first version of the library. The project is open for contributors, and any help is welcome.

## Usage Tips

1. **Code Organization**: Group related services into modules.
2. **Naming**: Use suffixes for different types of classes (Service, Repository, Presenter).
3. **Singleton modules**: Use `@Singleton()` for modules that should be available with explicit import without creating new instances.
4. **Presenters**: Use presenters to separate business logic from UI framework.
5. **Testing**: The library makes testing easier by allowing real implementations to be replaced with mocks.

## Philosophy and Principles

FlexDI is designed to support SOLID principles and clean architecture:
- Clear separation of business logic from presentation
- Separate testing of components
- High modularity and code reusability
- Reduction of bugs through strict typing and dependency inversion

The absence of global providers is a conscious design decision, not a limitation. This approach reduces the risk of implicit dependencies and increases code maintainability.

Circular dependencies between modules are technically possible, but not recommended for maintaining clean architecture and simplifying debugging. Improvements in this area are planned for future versions.


## Installation

### Basic Installation
```bash
npm install flexdi reflect-metadata
# or
yarn add flexdi reflect-metadata
```

### React/ReactNative/Vue3 useObservable under hood use RxJs. 
#### Additional installation
```bash
npm install rxjs
# or
yarn add rxjs
```

## Project configuration
### Reflect Metadata
Add the reflect-metadata import at your application's entry point (before using any decorators):

```typescript
// index.ts or app.ts or main.ts (your entry file)
import 'reflect-metadata'
// ... rest of your imports and code
```

### TypeScript Configuration
Make sure your tsconfig.json includes:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Vue3 setup:
```vue
import { flexdiPlugin } from 'flexdi/vue3'

createApp(App)
.use(flexdiPlugin) // add flexdi directives
.mount('#app')
```

### ReactNative setup (expo)
```bash
npm install babel-plugin-transform-typescript-metadata
# or
yarn add babel-plugin-transform-typescript-metadata
```
```js 
// babel.config.js

module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      "babel-plugin-transform-typescript-metadata",
      ["@babel/plugin-proposal-decorators", { "legacy": true }],
      ["@babel/plugin-proposal-class-properties", { "loose": true }],
    ]
  }
}

```

```js
// metro.config.js
const {getDefaultConfig} = require('@expo/metro-config')

const config = getDefaultConfig(__dirname)

config.resolver.unstable_enablePackageExports = true;
config.resolver.sourceExts.unshift("mjs");

module.exports = config
```

## Core Concepts

FlexDI is built on the following concepts:

- **Modules** - core building blocks of the application that encapsulate logic and services
- **Providers** - objects that describe how to create and provide dependencies
- **Dependency Injection** - automatic provision of dependencies to components
- **Scopes** - managing object lifetimes (Singleton, Transient)

## Working Example

#### React A full-featured React project built using FlexDI can be found in the repository:
[https://github.com/AndreyShashlovDev/scalpel-frontend](https://github.com/AndreyShashlovDev/scalpel-frontend/tree/master)

#### React Native Sample project
[https://github.com/AndreyShashlovDev/flexdi-rn](https://github.com/AndreyShashlovDev/flexdi-rn/tree/master)

#### Vue3 Sample project
[https://github.com/AndreyShashlovDev/flexdi-vue3](https://github.com/AndreyShashlovDev/flexdi-vue3/tree/master)

## Usage

### Defining a Module

```typescript
import { Module } from 'flexdi'
import { AuthService } from './services/auth.service'
import { AuthServiceImpl } from './services/auth.service.impl'
import { UserService } from './services/user.service'
import { UserServiceImpl } from './services/user.service.impl'

@Module({
  providers: [
    { provide: AuthService, useClass: AuthServiceImpl },
    { provide: UserService, useClass: UserServiceImpl }
  ],
  exports: [AuthService, UserService]
})
export class AppModule {}
```

### Defining a Service with Dependency Injection

```typescript
import { Inject, Injectable } from 'flexdi'
import { UserRepository } from '../repositories/user.repository'

@Injectable()
export class UserServiceImpl {
  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository
  ) {}

  async getUsers() {
    return this.userRepository.getAll()
  }
}
```

### Different modules for React/ React Native / Vue3
```typescript
// react project
import { RootModuleLoader } from 'flexdi/react'

// react native project
import { RootModuleLoader } from 'flexdi/react-native'

// vue3 project
import { RootModuleLoader } from 'flexdi/vue3'
```

## Detailed Guide

### Decorators

#### `@Module`

Defines a class as a module that can contain providers and import other modules.

Parameters:
- `providers` - array of providers available within the module
- `imports` - array of modules that are imported by the current module
- `exports` - array of providers that will be available to modules importing the current module

```typescript
@Module({
  imports: [CommonModule, AuthModule],
  providers: [
    { provide: UserService, useClass: UserServiceImpl },
    { provide: 'API_URL', useValue: 'https://api.example.com' }
  ],
  exports: [UserService]
})
export class UserModule {}
```

Important to note:
- All exports from the root module become available to all modules that are loaded after it.
- By default, each service has a Singleton scope and is visible in the current module and in modules that import it.
- Independent modules do not have access to exports of other modules unless these modules are imported into the current module.

#### `@Injectable`

Marks a class as available for dependency injection. Optionally, you can specify the scope.

```typescript
@Injectable() // Default is Scope.SINGLETON
export class UserServiceImpl {}

@Injectable(Scope.TRANSIENT) // New instance on each request
export class LoggerServiceImpl {}
```

#### `@Inject`

Specifies the token for dependency injection in the constructor. The token can be:
- An abstract class (Abstract<any>)
- A string (string)
- A symbol (Symbol)
- A concrete class (Type)

```typescript
constructor(
  @Inject(UserService) private readonly userService: UserService, // Class
  @Inject('API_URL') private readonly apiUrl: string, // String
  @Inject(Symbol.for('Logger')) private readonly logger: Logger, // Symbol
  @Inject(SomeRepository) private readonly repo: Repository // Abstract class
) {}
```

#### `@Singleton`

Marks a module as a singleton that will be created only once and available to all modules with explicit import.

```typescript
@Singleton()
@Module({
  providers: [{ provide: SharedService, useClass: SharedServiceImpl }],
  exports: [SharedService]
})
export class SharedModule {}
```

A module marked as `@Singleton()` can be created at any time, and from that moment it will be available to everyone as a singleton, but only when explicitly imported into a module.

### Provider Types

#### Class Provider

```typescript
{
  provide: UserService,
  useClass: UserServiceImpl,
  scope: Scope.SINGLETON // optional
}
```

#### Value Provider

```typescript
{
  provide: 'API_KEY',
  useValue: 'secret-api-key'
}
```

#### Factory Provider (supports async)

```typescript
{
  provide: 'ApiClient',
  deps: [ConfigService, LoggerService],
    
  useFactory: async (configService, logger) => {
    const config = await configService.getConfig()
    return new ApiClientImpl(config.apiUrl, logger)
  },
}
```

#### Token Provider

```typescript
{
  provide: 'UserServiceAlias',
  useToken: UserService
}
```

### Basic Presenters

Presenters must inherit from `BasicPresenter` and implement the `ready` and `destroy` methods:

```typescript
export abstract class BasicPresenter<InitArgs> {
  protected args?: InitArgs

  public init(args?: InitArgs): void {
    this.args = args
    this.ready(args)
  }

  public abstract ready(args?: InitArgs): void
  public abstract destroy(): void
}
```

Example of a presenter with access to args:

```typescript
export interface UserPresenterArgs {
  userId: string
}

abstract class UserPresenter extends BasicPresenter<UserPresenterArgs> {
  abstract getUsers(): Observable<User[]>
}

@Injectable()
export class UserPresenterImpl extends UserPresenter {
  private users = new BehaviorSubject<User[]>([])

  constructor(
    @Inject(UserService) private readonly userService: UserService
  ) {
    super()
  }

  public ready(args?: UserPresenterArgs): void {
    // You can use arguments from args
    const userId = args?.userId || 'default'

    // Or through this.args
    console.log(`Initializing for user: ${this.args?.userId}`)

    this.loadUsers(userId)
  }

  public destroy(): void {
    // Cleanup resources when component is destroyed
    this.users.complete()
  }

  private async loadUsers(userId: string): Promise<void> {
    const users = await this.userService.getUsersByManager(userId)
    this.users.next(users)
  }

  public getUsers(): Observable<User[]> {
    return this.users.asObservable()
  }
}
```

### Lifecycle Management

Components can implement the `OnDisposeInstance` interface to perform resource cleanup when a service is unloaded from the DI container:

```typescript
import { OnDisposeInstance } from 'flexdi'

export class DatabaseServiceImpl implements OnDisposeInstance {
  private connection: Connection

  constructor() {
    this.connection = createConnection()
  }

  // Automatically called when the service is unloaded from the DI container
  onDisposeInstance(): void {
    this.connection.close()
  }
}
```

The `destroy()` method in presenters is called when the view part of the component is destroyed.

### Working with Asynchronous Dependencies

FlexDI supports asynchronous initialization and the use of Promises:

```typescript
@Module({
  providers: [
    {
      provide: 'Config',
      useFactory: async () => {
        const response = await fetch('/api/config')
        return await response.json()
      }
    }
  ],
  exports: ['Config']
})
export class ConfigModule {}
```

## Integration

### useInject

Hook for injecting dependencies into functional components:

```tsx
const userService = useInject(UserService)
```

### usePresenter

Hook for working with presenters, automatically manages their lifecycle:

```tsx
// Parameters are passed to the init(args?: InitArgs) -> ready(args?: InitArgs) method and are available through this.args
const presenter = usePresenter(UserPresenter, { userId: '123' })
```

### useObservable

Hook for subscribing to Observable with automatic unsubscription:

```tsx
const users = useObservable(presenter.getUsers(), [])
```


## React (basic usage same for ReactNative)
### Setting Up the Root Module

Applications should always start with a root module:

```tsx
import { RootModuleLoader, ErrorBoundary } from 'flexdi/react'
import { AppModule } from './modules/app.module'
import { App } from './App'

const root = createRoot(document.getElementById('root'))
root.render(
  <RootModuleLoader
    module={AppModule}
    ErrorBoundary={ErrorBoundary} // is optional (or custom)
    LoadingComponent={LoadingSpinner}
    ErrorComponent={ErrorView}
    enableStrictMode={false} // true ONLY if <StrictMode> is used and you are in dev mode
  >
    <App />
  </RootModuleLoader>
)
```

## Vue3
### Setting Up the Root Module

Applications should always start with a root module:
```vue
<script setup lang="ts">
import { RootModuleLoader } from 'flexdi/vue3'
import ErrorComponent from './common/app-ui/ErrorComponent.vue'
import LoadingComponent from './common/app-ui/LoadingComponent.vue'
import { RootModule } from './RootModule.ts'

const rootModule = RootModule
</script>

<template>
  <RootModuleLoader
      :module="rootModule"
      :loading-component="LoadingComponent"
      :error-component="ErrorComponent"
  >
    <router-view></router-view>
  </RootModuleLoader>
</template>

```
### Using Dependencies in React / React Native Components

```tsx
import { usePresenter, useInject, useObservable } from 'flexdi/react'
import { UserService } from './services/user.service'
import { UserPresenter } from './presenters/user.presenter'

export const UserList = () => {
  // Using presenter with automatic initialization and cleanup
  const presenter = usePresenter(UserPresenter)
  const users = useObservable(presenter.getUsers(), [])
  
  // Using service injection
  const userService = useInject(UserService)
  
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Using Dependencies in Vue3 Components

```vue
<script setup lang="ts">
import { useInject, useObservable, usePresenter } from 'flexdi/vue3'
import { ServiceA } from '../../../common/service/ServiceA.ts'
import { HomePagePresenter } from '../domain/HomePagePresenter.ts'

const presenter = usePresenter(HomePagePresenter, {userId: 123})
const user = useObservable(presenter.getUser(), null)
const error = useObservable(presenter.error(), null)
const isLoading = useObservable(presenter.isLoading(), true)

const serviceA = useInject(ServiceA)

function loadUser() {
  presenter.onUserLoadClick()
}

function callServiceA() {
  serviceA.doSomething()
}
</script>

<template>
  <div>
    <h1>User home page</h1>
    <div v-if="isLoading">Loading...</div>
    <div v-else-if="error">Error is: {{ error }}</div>
    <div v-else-if="user">
      <h2>{{ user.name }}</h2>
      <p>Email: {{ user.email }}</p>
      <button @click="loadUser()">Load user 123</button>
      <button @click="callServiceA()">Call service A</button>
    </div>
  </div>
</template>
```

### RootModuleLoader React / ReactNative

Component for loading the root module of the application:

```tsx
<RootModuleLoader
  module={AppModule}
  ErrorBoundary={ErrorBoundaryView}
  LoadingComponent={LoadingView}
  ErrorComponent={ErrorView}
  enableStrictMode={false} // true ONLY if <StrictMode> is used and you are in dev mode
>
  <App />
</RootModuleLoader>
```

The `enableStrictMode` parameter should be set to `true` ONLY when `<StrictMode>` is used in the application and you are in development mode. Otherwise, be sure to set it to `false`, otherwise the presenters will not receive ready/destroy events and will not work correctly.


### RootModuleLoader Vue3

Component for loading the root module of the application:
```vue
<script setup lang="ts">
import { RootModuleLoader } from 'flexdi/vue3'
import ErrorComponent from './common/app-ui/ErrorComponent.vue'
import LoadingComponent from './common/app-ui/LoadingComponent.vue'
import { RootModule } from './RootModule.ts'

const rootModule = RootModule
</script>

<template>
  <RootModuleLoader
    :module="rootModule"
    :loading-component="LoadingComponent"
    :error-component="ErrorComponent"
  >
    <router-view></router-view>
  </RootModuleLoader>
</template>
```

### ModuleLoader React / React Native

Component for loading a module and its dependencies:

```tsx
<ModuleLoader
  module={FeatureModule}
  // children?: ReactNode
  // or
  // Component?: ComponentType<any>
  ErrorBoundary={ErrorBoundaryView}
  LoadingComponent={LoadingView}
  ErrorComponent={ErrorView}
>
  {/*children*/}
  <FeatureComponent /> 
</ModuleLoader>
```

### ModuleLoader Vue3

Component for loading the root module of the application:
```vue
<script setup lang="ts">
import { ModuleLoader } from 'flexdi/vue3'
import ErrorComponent from './common/app-ui/ErrorComponent.vue'
import LoadingComponent from './common/app-ui/LoadingComponent.vue'
import { FeatureModule } from './FeatureModule.ts'

const featureModule = FeatureModule
</script>

<template>
  <ModuleLoader
    :module="featureModule"
    :loading-component="LoadingComponent"
    :error-component="ErrorComponent"
  >
    <router-view></router-view>
  </ModuleLoader>
</template>
```

### createModuleRoute React

Function for creating a React Router route with module support and lazy loading of components:

```tsx
import { lazy } from 'react'
import { createModuleRoute } from 'flexdi/react'

// Lazy loading of component
const UserPage = lazy(() => import('./pages/UserPage'))

const route = createModuleRoute({
  path: '/users',
  module: UserPageModule,
  Component: UserPage, // Lazily loaded component
  ErrorBoundary: ErrorBoundary,
  LoadingComponent: LoadingView,
  ErrorComponent: ErrorView
})
```

Example usage with multiple routes:

```tsx
import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'

const HomePage = lazy(() => import('./pages/HomePage'))
const UserPage = lazy(() => import('./pages/UserPage'))

const createAppRoute = (
  {
    path,
    feature,
    module
  }: { path: string, feature: LazyExoticComponent<ComponentType<unknown>>, module: ModuleType }
) => createModuleRoute({
  path,
  module: module,
  Component: feature,
  ErrorBoundary: ErrorBoundary,
  LoadingComponent: LoadingView,
  ErrorComponent: ErrorView,
})

const appRoutes = [
  createAppRoute({
    path: '/',
    feature: HomePage,
    module: HomePageModule,
  }),
  createAppRoute({
    path: '/users',
    feature: UserPage,
    module: UserPageModule,
  })
]

const router = createBrowserRouter(appRoutes)
```

### createModuleScreen / createModuleNavigator React Native
Function for creating a React native navigation with module support and lazy loading of components:

```tsx
import { createStackNavigator } from '@react-navigation/stack'
import { createModuleNavigator, createModuleScreen, ErrorBoundary } from 'flexdi/react-native'
import React from 'react'
import ErrorScreen from '../common/app-ui/ErrorScreen'
import LoadingScreen from '../common/app-ui/LoadingScreen'
import { CounterScreenModule } from '../feature/counter/di/CounterScreenModule'
import CounterScreen from '../feature/counter/presentation/CounterScreen'
import { HomeScreenModule } from '../feature/home/di/HomeScreenModule'
import HomeScreen from '../feature/home/presentation/HomeScreen'
import { ProfileScreenModule } from '../feature/user/di/ProfileScreenModule'
import ProfileScreen from '../feature/user/presentation/ProfileScreen'
import { NavigationScreen } from './NavigationScreen'

const Stack = createStackNavigator()

// external screen creation
const CounterScreenWithModule = createModuleScreen({
  module: CounterScreenModule,
  Component: CounterScreen,
  LoadingComponent: LoadingScreen,
  ErrorComponent: ErrorScreen,
  ErrorBoundary: ErrorBoundary,
  navigationOptions: {
    title: 'Counter'
  }
})

const navigatorConfig = createModuleNavigator({
  type: 'stack',
  screens: [
    {
      name: NavigationScreen.HOME,
      Component: HomeScreen,
      module: HomeScreenModule,
      options: {title: 'Main'}
    },
    {
      name: NavigationScreen.PROFILE,
      Component: ProfileScreen,
      module: ProfileScreenModule,
      options: {title: 'Profile'}
    }
  ],
  defaultScreenOptions: {
    headerStyle: {
      backgroundColor: '#4a90e2',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  },
  LoadingComponent: LoadingScreen,
  ErrorComponent: ErrorScreen,
  // ErrorBoundary:  optional (used by default boundary)
})

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={NavigationScreen.HOME}
      screenOptions={navigatorConfig.navigatorOptions}
    >
      {navigatorConfig.screens.map(screen => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.component.navigationOptions}
        />
      ))}
      <Stack.Screen
        name={NavigationScreen.COUNTER}
        component={CounterScreenWithModule}
        options={CounterScreenWithModule.navigationOptions}
      />
    </Stack.Navigator>
  )
}

export default AppNavigator

```

### createModuleRoute Vue3

Function for creating a Vue Router route with module support and lazy loading of components:

```typescript
import { createModuleRoute } from 'flexdi/vue3'
import { HomePageModule } from '../../feature/home/di/HomePageModule.ts'
import ErrorComponent from '../app-ui/ErrorComponent.vue'
import LoadingComponent from '../app-ui/LoadingComponent.vue'

export default [
  createModuleRoute({
    path: '/',
    name: 'home', // optional
    // meta?: Record<string, unknown> -- optional
    module: HomePageModule,
    component: () => import('../../feature/home/presentation/HomePageView.vue'),
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent
  }),
]
```

## Usage Examples

### Basic Application Example with Abstract Service

```tsx
import { BasicPresenter } from './BasicPresenter'

export interface User {
  name: string
  role: string
}

// Defining an abstract class and implementation
export abstract class AuthService {
  abstract isAuthenticated(): boolean

  abstract getUserInfo(): User
}

@Injectable()
class AuthServiceImpl extends AuthService {
  isAuthenticated(): boolean {
    return true
  }

  getUserInfo(): User {
    return {name: 'Admin', role: 'admin'}
  }
}

// Defining modules
@Module({
  providers: [
    // Binding abstract class to concrete implementation
    {provide: AuthService, useClass: AuthServiceImpl}
  ],
  exports: [AuthService]
})
class AuthModule {}

abstract class UserPresenter extends BasicPresenter<void> {
  
  abstract isUserAuthenticated(): Observable<boolean>

  abstract getUserInfo(): Observable<User>
}

// Presenter uses abstract class
@Injectable()
class UserPresenterImpl extends UserPresenter {
  private isAuthenticated = new BehaviorSubject<boolean>(false)
  private userInfo = new BehaviorSubject<User>({name: '', role: ''})

  constructor(@Inject(AuthService) private authService: AuthService) {
    super()
  }

  ready() {
    console.log('UserPresenter initialized')
    this.updateUserState()
  }

  destroy() {
    console.log('UserPresenter destroyed')
    this.isAuthenticated.complete()
    this.userInfo.complete()
  }

  private updateUserState() {
    this.isAuthenticated.next(this.authService.isAuthenticated())
    this.userInfo.next(this.authService.getUserInfo())
  }

  isUserAuthenticated(): Observable<boolean> {
    return this.isAuthenticated.asObservable()
  }

  getUserInfo(): Observable<User> {
    return this.userInfo.asObservable()
  }
}

@Module({
  imports: [AuthModule],
  providers: [{provide: UserPresenter, useClass: UserPresenterImpl}],
  exports: [UserPresenter]
})
class UserModule {}

// React component
const App = () => {
  const presenter = usePresenter(UserPresenter)
  const userInfo = useObservable(presenter.getUserInfo(), {name: '', role: ''})
  const isAuthenticated = useObservable(presenter.isUserAuthenticated(), false)

  return (
    <div>
      <h1>Welcome, {userInfo.name}!</h1>
      <p>Role: {userInfo.role}</p>
      <p>Status: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
    </div>
  )
}

// Application entry point
createRoot(document.getElementById('root')).render(
  <RootModuleLoader
    module={UserModule}
    ErrorBoundary={ErrorBoundaryView}
    LoadingComponent={LoadingSpinnerView}
    ErrorComponent={ErrorViewView}
    enableStrictMode={false} // Only if <StrictMode> is used and you are in dev mode
  >
    <ModuleLoader
      module={AppPageModule}
      // children = {}
      // Component = {}
      ErrorBoundary={ErrorBoundaryView}
      LoadingComponent={LoadingSpinnerView}
      ErrorComponent={ErrorViewView}
    >
      {/* children used */}
      <App />
    </ModuleLoader>
  </RootModuleLoader>
)
```

## API Reference

### ModuleManager

ModuleManager is a global service for managing modules. Here are its main public methods:

#### `loadModule<T>(moduleClass: ModuleType, isRootModule: boolean = false): Promise<T>`

Loads a module and all its dependencies. If `isRootModule` is set to `true`, the module will be loaded as the root module of the application.

```typescript
// Loading the root module
await moduleManager.loadModule(AppModule, true)

// Loading a regular module
await moduleManager.loadModule(FeatureModule)
```

#### `getService<T>(moduleClass: ModuleType, token: InjectionToken<unknown>): T`

Gets a service instance from a loaded module.

```typescript
// Getting a service
const authService = moduleManager.getService<AuthService>(AppModule, AuthService)
```

#### `isModuleLoaded(moduleClass: ModuleType): boolean`

Checks if a module is loaded.

```typescript
if (moduleManager.isModuleLoaded(FeatureModule)) {
  console.log('Module is already loaded')
}
```

#### `unloadModule(moduleClass: ModuleType): void`

Unloads a module and all its unused dependencies.

```typescript
// Unloading a module
moduleManager.unloadModule(FeatureModule)
```

#### `isRootModule(moduleClass: ModuleType): boolean`

Checks if a module is the root module.

```typescript
if (moduleManager.isRootModule(AppModule)) {
  console.log('This is the root module')
}
```

## Testing with FlexDI

FlexDI is great for unit testing thanks to its ability to easily replace dependencies with mocks. Here's an example of testing using Vitest:

### Mocking Services

```typescript
import { Inject, Injectable, Module, ModuleManager, ModuleManagerFactory } from 'flexdi'
import { beforeEach, describe, expect, it, vi } from 'vitest'

abstract class DataService {
  abstract getData(): string[]
}

// Mock service
@Injectable()
class MockDataServiceImpl extends DataService {
  getData = vi.fn().mockReturnValue(['test', 'data'])
}

abstract class UserService {
  abstract processData(): string[]
}

// Service being tested
@Injectable()
class UserServiceImpl {
  constructor(@Inject(DataService) private dataService: DataService) {}

  processData() {
    const data = this.dataService.getData()
    return data.map(item => item.toUpperCase())
  }
}

// Test module with mock
@Module({
  providers: [
    {provide: DataService, useClass: MockDataServiceImpl},
    {provide: UserService, useClass: UserServiceImpl}
  ],
  exports: [UserService, DataService]
})
class TestModule {}

describe('UserService', () => {
  let userService: UserService
  let mockDataService: DataService
  let testModuleManager: ModuleManager

  beforeEach(async () => {
    // Create a new ModuleManager instance for complete test isolation
    ModuleManagerFactory.resetInstance()
    testModuleManager = ModuleManagerFactory.getInstance()

    // Load the test module with our isolated ModuleManager
    await testModuleManager.loadModule(TestModule, true)

    // Get services from the test module
    userService = testModuleManager.getService<UserServiceImpl>(TestModule, UserService)
    mockDataService = testModuleManager.getService<DataService>(TestModule, DataService)
  })

  it('should process data correctly', () => {
    // Check mock service call
    const result = userService.processData()
    expect(mockDataService.getData).toHaveBeenCalled()
    expect(result).toEqual(['TEST', 'DATA'])
  })
})
```

### Testing Presenters

```typescript
import { BasicPresenter, Inject, Injectable, Module, ModuleManager, ModuleManagerFactory } from 'flexdi'
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface User {
  name: string
}

abstract class AuthService {
  abstract isAuthenticated(): boolean

  abstract getUser(): User | null
}

// Mock service
@Injectable()
class MockAuthServiceImpl extends AuthService {
  isAuthenticated = vi.fn().mockReturnValue(true)
  getUser = vi.fn().mockReturnValue({id: 1, name: 'Test User'})
}

abstract class UserPresenter extends BasicPresenter<void> {
  abstract getUser(): Observable<User | null>
}

// Presenter to test
@Injectable()
class UserPresenterImpl extends UserPresenter {
  private user = new BehaviorSubject<User | null>(null)

  constructor(@Inject(AuthService) private authService: AuthService) {
    super()
  }

  ready() {
    if (this.authService.isAuthenticated()) {
      this.user.next(this.authService.getUser())
    }
  }

  destroy() {
    this.user.complete()
  }

  getUser(): Observable<User | null> {
    return this.user.asObservable()
  }
}

@Module({
  providers: [
    {provide: AuthService, useClass: MockAuthServiceImpl},
    {provide: UserPresenter, useClass: UserPresenterImpl}
  ],
  exports: [AuthService, UserPresenter]
})
class TestModule {}

describe('UserPresenter', () => {
  let presenter: UserPresenter
  let mockAuthService: AuthService
  let testModuleManager: ModuleManager

  beforeEach(async () => {
    ModuleManagerFactory.resetInstance()
    // Create a new ModuleManager instance for complete test isolation
    testModuleManager = ModuleManagerFactory.getInstance()

    // Load the test module with our isolated ModuleManager
    await testModuleManager.loadModule(TestModule, true)

    // Get services from the test module
    presenter = testModuleManager.getService<UserPresenter>(TestModule, UserPresenter)
    mockAuthService = testModuleManager.getService<MockAuthServiceImpl>(TestModule, AuthService)

    // Manual init call, simulating lifecycle
    presenter.init()
  })

  it('should load user when authenticated', async () => {
    const user = await firstValueFrom(presenter.getUser())

    expect(mockAuthService.isAuthenticated).toHaveBeenCalled()
    expect(mockAuthService.getUser).toHaveBeenCalled()
    expect(user?.name).toBe('Test User')
  })
})
```

### Testing React hooks
```typescript jsx
import { render, screen, waitFor } from '@testing-library/react'
import React, { useLayoutEffect, useRef } from 'react'
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  BasicPresenter,
  Inject,
  Injectable,
  Module,
  ModuleManager,
  ModuleManagerFactory,
  ModuleProvider,
} from 'flexdi'
import {useInject, useObservable, usePresenter} from 'flexdi/react'
import '@testing-library/jest-dom'

interface User {
  id: number
  name: string
  email: string
}

abstract class UserService {
  abstract getUsers(): Observable<User[]>
  abstract updateUsers(users: User[]): void
}

@Injectable()
class MockUserServiceImpl extends UserService {
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

abstract class UserPresenter extends BasicPresenter<void> {

  abstract getUsers(): Observable<User[]>

  abstract filterUsersByName(query: string): void
}

@Injectable()
class UserPresenterImpl extends UserPresenter {
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
    {provide: UserService, useClass: MockUserServiceImpl},
    {provide: UserPresenter, useClass: UserPresenterImpl}
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
  let mockUserService: UserService

  beforeEach(async () => {
    ModuleManagerFactory.resetInstance()
    testModuleManager = ModuleManagerFactory.getInstance()
    await testModuleManager.loadModule(TestModule, true)

    mockUserService = testModuleManager.getService<UserService>(TestModule, UserService)
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
    mockUserService.updateUsers(newUsers)

    await waitFor(() => {
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })
})
```

## Supporting the Project

If you like FlexDI and find it useful for your project, please support it:

- ⭐ Star it on GitHub
- 🍴 Fork it to contribute improvements
- 📢 Tell your colleagues about the library

Your support helps to develop the project and make it better!
