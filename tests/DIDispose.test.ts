import 'reflect-metadata'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Injectable, Module, ModuleManager, ModuleManagerFactory, OnDisposeInstance, preloadModule } from '../src/core'

describe('onDisposeInstance Lifecycle', () => {
  let moduleManager: ModuleManager

  beforeEach(() => {
    ModuleManagerFactory.resetInstance()
    moduleManager = ModuleManagerFactory.getInstance()
  })

  test('onDisposeInstance is called when module is unloaded', async () => {
    const onDisposeSpy = vi.fn()

    @Injectable()
    class ServiceWithDispose implements OnDisposeInstance {
      onDisposeInstance(): void {
        onDisposeSpy()
      }
    }

    @Module({
      providers: [
        {provide: 'ServiceWithDispose', useClass: ServiceWithDispose}
      ],
      exports: ['ServiceWithDispose']
    })
    class TestModule {}

    await preloadModule(TestModule, false)

    moduleManager.getService<ServiceWithDispose>(TestModule, 'ServiceWithDispose')

    expect(onDisposeSpy).not.toHaveBeenCalled()

    moduleManager.unloadModule(TestModule)

    expect(onDisposeSpy).toHaveBeenCalledTimes(1)
  })

  test('onDisposeInstance is not called if module cannot be unloaded', async () => {
    const onDisposeSpy = vi.fn()

    @Injectable()
    class ServiceWithDispose implements OnDisposeInstance {
      onDisposeInstance(): void {
        onDisposeSpy()
      }
    }

    @Module({
      providers: [
        {provide: 'ServiceWithDispose', useClass: ServiceWithDispose}
      ],
      exports: ['ServiceWithDispose']
    })
    class TestModule {}

    @Module({
      imports: [TestModule],
      providers: [],
      exports: []
    })
    class RootModule {}

    await preloadModule(RootModule, true)
    moduleManager.unloadModule(TestModule)

    expect(onDisposeSpy).not.toHaveBeenCalled()
  })

  test('Multiple providers with onDisposeInstance in the same module', async () => {
    const onDisposeSpy1 = vi.fn()
    const onDisposeSpy2 = vi.fn()

    @Injectable()
    class Service1WithDispose implements OnDisposeInstance {
      onDisposeInstance(): void {
        onDisposeSpy1()
      }
    }

    @Injectable()
    class Service2WithDispose implements OnDisposeInstance {
      onDisposeInstance(): void {
        onDisposeSpy2()
      }
    }

    @Module({
      providers: [
        {provide: 'Service1', useClass: Service1WithDispose},
        {provide: 'Service2', useClass: Service2WithDispose}
      ],
      exports: ['Service1', 'Service2']
    })
    class TestModule {}

    await preloadModule(TestModule, false)

    moduleManager.getService<Service1WithDispose>(TestModule, 'Service1')
    moduleManager.getService<Service2WithDispose>(TestModule, 'Service2')

    moduleManager.unloadModule(TestModule)

    expect(onDisposeSpy1).toHaveBeenCalledTimes(1)
    expect(onDisposeSpy2).toHaveBeenCalledTimes(1)
  })

  test('onDisposeInstance is not called for providers without the method', async () => {
    const onDisposeSpy = vi.fn()

    @Injectable()
    class ServiceWithDispose implements OnDisposeInstance {
      onDisposeInstance(): void {
        onDisposeSpy()
      }
    }

    @Injectable()
    class ServiceWithoutDispose {
    }

    @Module({
      providers: [
        {provide: 'ServiceWithDispose', useClass: ServiceWithDispose},
        {provide: 'ServiceWithoutDispose', useClass: ServiceWithoutDispose}
      ],
      exports: ['ServiceWithDispose', 'ServiceWithoutDispose']
    })
    class TestModule {}

    await preloadModule(TestModule, false)

    moduleManager.getService<ServiceWithDispose>(TestModule, 'ServiceWithDispose')
    moduleManager.getService<ServiceWithoutDispose>(TestModule, 'ServiceWithoutDispose')

    moduleManager.unloadModule(TestModule)

    expect(onDisposeSpy).toHaveBeenCalledTimes(1)
  })

  test('onDisposeInstance for factory providers', async () => {
    const onDisposeSpy = vi.fn()

    @Module({
      providers: [
        {
          provide: 'FactoryService',
          useFactory: () => ({
            someMethod: () => 'factory service',
            onDisposeInstance: () => onDisposeSpy()
          })
        }
      ],
      exports: ['FactoryService']
    })
    class TestModule {}

    await preloadModule(TestModule, false)

    const service = moduleManager.getService<any>(TestModule, 'FactoryService')
    expect(service.someMethod()).toBe('factory service')

    moduleManager.unloadModule(TestModule)

    expect(onDisposeSpy).toHaveBeenCalledTimes(1)
  })

  test('onDisposeInstance with custom cleanup behavior', async () => {
    const mockResource = {
      isOpen: true,
      close() {
        this.isOpen = false
      }
    }

    @Injectable()
    class ResourceService implements OnDisposeInstance {
      constructor() {
        mockResource.isOpen = true
      }

      useResource() {
        return mockResource.isOpen ? 'resource is open' : 'resource is closed'
      }

      onDisposeInstance(): void {
        mockResource.close()
      }
    }

    @Module({
      providers: [
        {provide: ResourceService, useClass: ResourceService}
      ],
      exports: [ResourceService]
    })
    class ResourceModule {}

    await preloadModule(ResourceModule, false)

    const service = moduleManager.getService<ResourceService>(ResourceModule, ResourceService)
    expect(service.useResource()).toBe('resource is open')
    expect(mockResource.isOpen).toBe(true)

    moduleManager.unloadModule(ResourceModule)

    expect(mockResource.isOpen).toBe(false)
  })
})
