import 'reflect-metadata'
import { beforeEach, describe, expect, test } from 'vitest'
import { Inject, Injectable, Module, moduleManager, preloadModule, Singleton } from '../src'

describe('Singleton Modules', () => {
  beforeEach(() => {
    const moduleRefs = (moduleManager as any).moduleRefs
    if (moduleRefs && moduleRefs instanceof Map) {
      moduleRefs.clear()
    }

    const globalModuleRefs = (moduleManager as any).globalModuleRefs
    if (globalModuleRefs && globalModuleRefs instanceof Map) {
      globalModuleRefs.clear()
    }

    (moduleManager as any).rootModuleRef = null
  })

  test('Singleton modules must be explicitly imported in each module that uses them', async () => {
    @Injectable()
    class SingletonService {
      public getValue(): string {
        return 'singleton value'
      }
    }

    @Singleton()
    @Module({
      providers: [
        {provide: SingletonService, useClass: SingletonService}
      ],
      exports: [SingletonService]
    })
    class SingletonModule {}

    @Injectable()
    class FirstConsumerService {
      constructor(
        @Inject(SingletonService) private readonly singletonService: SingletonService
      ) {}

      public getSingletonValue(): string {
        return this.singletonService.getValue()
      }
    }

    @Module({
      imports: [SingletonModule],
      providers: [
        {provide: FirstConsumerService, useClass: FirstConsumerService}
      ],
      exports: [FirstConsumerService]
    })
    class FirstConsumerModule {}

    @Injectable()
    class SecondConsumerService {
      constructor(
        @Inject(SingletonService) private readonly singletonService: SingletonService
      ) {}

      public getSingletonValue(): string {
        return this.singletonService.getValue()
      }
    }

    @Module({
      imports: [SingletonModule],
      providers: [
        {provide: SecondConsumerService, useClass: SecondConsumerService}
      ],
      exports: [SecondConsumerService]
    })
    class SecondConsumerModule {}

    await preloadModule(FirstConsumerModule, true)
    await preloadModule(SecondConsumerModule, false)

    const firstService = moduleManager.getService<FirstConsumerService>(
      FirstConsumerModule,
      FirstConsumerService
    )
    const secondService = moduleManager.getService<SecondConsumerService>(
      SecondConsumerModule,
      SecondConsumerService
    )

    // Check that both services can access SingletonService
    expect(firstService.getSingletonValue()).toBe('singleton value')
    expect(secondService.getSingletonValue()).toBe('singleton value')

    // Check that it's the same SingletonService instance
    const singletonService1 = await (moduleManager as any)
      .getLoadedModule(FirstConsumerModule)
      .resolveProvider(SingletonService)

    const singletonService2 = await (moduleManager as any)
      .getLoadedModule(SecondConsumerModule)
      .resolveProvider(SingletonService)

    expect(singletonService1).toBe(singletonService2)
  })

  test('Singleton module cannot be unloaded even if imported in multiple places', async () => {
    @Injectable()
    class SingletonService {
      public getValue(): string {
        return 'singleton value'
      }
    }

    @Singleton()
    @Module({
      providers: [
        {provide: SingletonService, useClass: SingletonService}
      ],
      exports: [SingletonService]
    })
    class SingletonModule {}

    @Module({
      imports: [SingletonModule],
      providers: [],
      exports: []
    })
    class FirstConsumerModule {}

    @Module({
      imports: [SingletonModule],
      providers: [],
      exports: []
    })
    class SecondConsumerModule {}

    await preloadModule(FirstConsumerModule, true)
    await preloadModule(SecondConsumerModule, false)

    expect(moduleManager.isModuleLoaded(SingletonModule)).toBe(true)

    moduleManager.unloadModule(SingletonModule)

    expect(moduleManager.isModuleLoaded(SingletonModule)).toBe(true)

    moduleManager.unloadModule(FirstConsumerModule)
    moduleManager.unloadModule(SecondConsumerModule)

    expect(moduleManager.isModuleLoaded(SingletonModule)).toBe(true)
  })

  test('Multiple singleton modules work together with explicit imports', async () => {
    @Injectable()
    class SingletonService1 {
      public getValue(): string {
        return 'singleton value 1'
      }
    }

    @Singleton()
    @Module({
      providers: [
        {provide: SingletonService1, useClass: SingletonService1}
      ],
      exports: [SingletonService1]
    })
    class SingletonModule1 {}

    @Injectable()
    class SingletonService2 {
      public getValue(): string {
        return 'singleton value 2'
      }
    }

    @Singleton()
    @Module({
      providers: [
        {provide: SingletonService2, useClass: SingletonService2}
      ],
      exports: [SingletonService2]
    })
    class SingletonModule2 {}

    @Injectable()
    class ConsumerService {
      constructor(
        @Inject(SingletonService1) private readonly singletonService1: SingletonService1,
        @Inject(SingletonService2) private readonly singletonService2: SingletonService2
      ) {}

      public getSingletonValues(): string[] {
        return [
          this.singletonService1.getValue(),
          this.singletonService2.getValue()
        ]
      }
    }

    @Module({
      imports: [SingletonModule1, SingletonModule2],
      providers: [
        {provide: ConsumerService, useClass: ConsumerService}
      ],
      exports: [ConsumerService]
    })
    class ConsumerModule {}

    await preloadModule(ConsumerModule, true)

    const service = moduleManager.getService<ConsumerService>(ConsumerModule, ConsumerService)

    // Check that it can access both singleton services
    expect(service.getSingletonValues()).toEqual(['singleton value 1', 'singleton value 2'])
  })

  test('Singleton modules maintain singleton instances across multiple imports', async () => {
    const instanceCounter = {
      count: 0,
      increment() {
        this.count++
        return this.count
      }
    }

    @Injectable()
    class SingletonServiceWithCounter {
      private readonly instanceId: number

      constructor() {
        this.instanceId = instanceCounter.increment()
      }

      public getInstanceId(): number {
        return this.instanceId
      }
    }

    @Singleton()
    @Module({
      providers: [
        {provide: SingletonServiceWithCounter, useClass: SingletonServiceWithCounter}
      ],
      exports: [SingletonServiceWithCounter]
    })
    class SingletonCounterModule {}

    @Injectable()
    class Consumer1Service {
      constructor(
        @Inject(SingletonServiceWithCounter) private readonly singletonService: SingletonServiceWithCounter
      ) {}

      public getSingletonInstanceId(): number {
        return this.singletonService.getInstanceId()
      }
    }

    @Module({
      imports: [SingletonCounterModule],
      providers: [
        {provide: Consumer1Service, useClass: Consumer1Service}
      ],
      exports: [Consumer1Service]
    })
    class Consumer1Module {}

    @Injectable()
    class Consumer2Service {
      constructor(
        @Inject(SingletonServiceWithCounter) private readonly singletonService: SingletonServiceWithCounter
      ) {}

      public getSingletonInstanceId(): number {
        return this.singletonService.getInstanceId()
      }
    }

    @Module({
      imports: [SingletonCounterModule],
      providers: [
        {provide: Consumer2Service, useClass: Consumer2Service}
      ],
      exports: [Consumer2Service]
    })
    class Consumer2Module {}

    instanceCounter.count = 0

    await preloadModule(Consumer1Module, true)
    await preloadModule(Consumer2Module, false)

    const service1 = moduleManager.getService<Consumer1Service>(Consumer1Module, Consumer1Service)
    const service2 = moduleManager.getService<Consumer2Service>(Consumer2Module, Consumer2Service)

    expect(service1.getSingletonInstanceId()).toBe(1)
    expect(service2.getSingletonInstanceId()).toBe(1)
    expect(instanceCounter.count).toBe(1)
  })
})
