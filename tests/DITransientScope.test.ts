import 'reflect-metadata'
import { beforeEach, describe, expect, test } from 'vitest'
import { Inject, Injectable, Module, ModuleManager, ModuleManagerFactory, Scope, preloadModule } from '../src/core'

describe('TRANSIENT scope through getService/useInject/usePresenter', () => {
  let moduleManager: ModuleManager

  beforeEach(() => {
    ModuleManagerFactory.resetInstance()
    moduleManager = ModuleManagerFactory.getInstance()
  })

  test('getService builds a fresh instance on every call for a directly exported TRANSIENT provider', async () => {
    let created = 0

    @Injectable(Scope.TRANSIENT)
    class CounterService {
      public readonly id = ++created
    }

    @Module({
      providers: [{provide: CounterService, useClass: CounterService}],
      exports: [CounterService]
    })
    class TestModule {}

    await preloadModule(TestModule, true)

    const a = moduleManager.getService<CounterService>(TestModule, CounterService)
    const b = moduleManager.getService<CounterService>(TestModule, CounterService)

    expect(a).not.toBe(b)
    expect(b.id).toBe(a.id + 1)
  })

  test('a TRANSIENT provider is rebuilt fresh while its SINGLETON dependency is shared', async () => {
    let created = 0

    @Injectable()
    class SharedDependency {
      public readonly value = 'shared'
    }

    @Injectable(Scope.TRANSIENT)
    class TransientConsumer {
      public readonly id = ++created

      constructor(@Inject(SharedDependency) public readonly dependency: SharedDependency) {}
    }

    @Module({
      providers: [
        {provide: SharedDependency, useClass: SharedDependency},
        {provide: TransientConsumer, useClass: TransientConsumer}
      ],
      exports: [TransientConsumer]
    })
    class TestModule {}

    await preloadModule(TestModule, true)

    const a = moduleManager.getService<TransientConsumer>(TestModule, TransientConsumer)
    const b = moduleManager.getService<TransientConsumer>(TestModule, TransientConsumer)

    expect(a).not.toBe(b)
    expect(a.dependency).toBe(b.dependency)
  })

  test('a TRANSIENT provider re-exported through a parent module still builds fresh instances', async () => {
    let created = 0

    @Injectable(Scope.TRANSIENT)
    class CounterService {
      public readonly id = ++created
    }

    @Module({
      providers: [{provide: CounterService, useClass: CounterService}],
      exports: [CounterService]
    })
    class FeatureModule {}

    @Module({
      imports: [FeatureModule],
      exports: [CounterService]
    })
    class AppModule {}

    await preloadModule(AppModule, true)

    const a = moduleManager.getService<CounterService>(AppModule, CounterService)
    const b = moduleManager.getService<CounterService>(AppModule, CounterService)

    expect(a).not.toBe(b)
    expect(b.id).toBe(a.id + 1)
  })

  test('SINGLETON scope is unaffected and keeps returning the same cached instance', async () => {
    @Injectable()
    class SingletonService {
      public counter = 0
    }

    @Module({
      providers: [{provide: SingletonService, useClass: SingletonService}],
      exports: [SingletonService]
    })
    class TestModule {}

    await preloadModule(TestModule, true)

    const a = moduleManager.getService<SingletonService>(TestModule, SingletonService)
    const b = moduleManager.getService<SingletonService>(TestModule, SingletonService)

    expect(a).toBe(b)
  })
})
