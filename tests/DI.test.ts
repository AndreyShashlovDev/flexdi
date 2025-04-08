import 'reflect-metadata'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Inject, Injectable, Module, ModuleManager, ModuleManagerFactory, preloadModule, Scope } from '../src/core'

describe('Module System', () => {
  let moduleManager: ModuleManager

  // Prepare test classes
  beforeEach(() => {
    ModuleManagerFactory.resetInstance()
    moduleManager = ModuleManagerFactory.getInstance()
  })

  describe('Basic Functionality', () => {
    test('Loading and getting service from root module', async () => {

      @Injectable()
      class TestService {
        public getValue(): string {
          return 'test value'
        }
      }

      @Module({
        providers: [
          {provide: TestService, useClass: TestService}
        ],
        exports: [TestService]
      })
      class RootModule {}

      // Load root module
      await preloadModule(RootModule, true)

      // Get service
      const service = moduleManager.getService<TestService>(RootModule, TestService)

      // Check
      expect(service).toBeInstanceOf(TestService)
      expect(service.getValue()).toBe('test value')
    })

    test('Loading regular module and getting service', async () => {
      @Injectable()
      class RootService {
        public getValue(): string {
          return 'root value'
        }
      }

      @Injectable()
      class TestService {
        public getValue(): string {
          return 'test value'
        }
      }

      @Module({
        providers: [
          {provide: RootService, useClass: RootService}
        ],
        exports: [RootService]
      })
      class RootModule {}

      @Module({
        imports: [RootModule],
        providers: [
          {provide: TestService, useClass: TestService}
        ],
        exports: [TestService]
      })
      class TestModule {}

      // Load modules
      await preloadModule(RootModule, true)
      await preloadModule(TestModule, false)

      // Get services
      const rootService = moduleManager.getService<RootService>(RootModule, RootService)
      const testService = moduleManager.getService<TestService>(TestModule, TestService)

      // Check
      expect(rootService).toBeInstanceOf(RootService)
      expect(testService).toBeInstanceOf(TestService)
      expect(rootService.getValue()).toBe('root value')
      expect(testService.getValue()).toBe('test value')
    })
  })

  describe('Dependency Injection', () => {
    test('Dependency injection through constructor', async () => {
      @Injectable()
      class DependencyService {
        public getValue(): string {
          return 'dependency value'
        }
      }

      @Injectable()
      class ServiceWithDependency {
        constructor(
          @Inject(DependencyService) private readonly dependencyService: DependencyService
        ) {}

        public getDependencyValue(): string {
          return this.dependencyService.getValue()
        }
      }

      @Module({
        providers: [
          {provide: DependencyService, useClass: DependencyService},
          {provide: ServiceWithDependency, useClass: ServiceWithDependency}
        ],
        exports: [ServiceWithDependency]
      })
      class TestModule {}

      // Load module
      await preloadModule(TestModule, true)

      // Get service
      const service = moduleManager.getService<ServiceWithDependency>(TestModule, ServiceWithDependency)

      // Check
      expect(service).toBeInstanceOf(ServiceWithDependency)
      expect(service.getDependencyValue()).toBe('dependency value')
    })

    test('Importing and using dependency from another module', async () => {
      @Injectable()
      class SharedService {
        public getValue(): string {
          return 'shared value'
        }
      }

      @Module({
        providers: [
          {provide: SharedService, useClass: SharedService}
        ],
        exports: [SharedService]
      })
      class SharedModule {}

      @Injectable()
      class ConsumerService {
        constructor(
          @Inject(SharedService) private readonly sharedService: SharedService
        ) {}

        public getSharedValue(): string {
          return this.sharedService.getValue()
        }
      }

      @Module({
        imports: [SharedModule],
        providers: [
          {provide: ConsumerService, useClass: ConsumerService}
        ],
        exports: [ConsumerService]
      })
      class ConsumerModule {}

      // Load modules
      await preloadModule(SharedModule, true)
      await preloadModule(ConsumerModule, false)

      // Get service
      const consumerService = moduleManager.getService<ConsumerService>(ConsumerModule, ConsumerService)

      // Check
      expect(consumerService).toBeInstanceOf(ConsumerService)
      expect(consumerService.getSharedValue()).toBe('shared value')
    })

    test('Using factory provider with dependencies', async () => {
      @Injectable()
      class ConfigService {
        public getApiUrl(): string {
          return 'https://api.example.com'
        }
      }

      interface ApiClient {
        makeRequest(): string;
      }

      class ApiClientImpl implements ApiClient {
        constructor(private readonly apiUrl: string) {}

        public makeRequest(): string {
          return `Making request to ${this.apiUrl}`
        }
      }

      @Module({
        providers: [
          {provide: ConfigService, useClass: ConfigService},
          {
            provide: 'ApiClient',
            useFactory: (configService: ConfigService) => {
              return new ApiClientImpl(configService.getApiUrl())
            },
            deps: [ConfigService]
          }
        ],
        exports: ['ApiClient']
      })
      class ApiModule {}

      // Load module
      await preloadModule(ApiModule, true)

      // Get service
      const apiClient = moduleManager.getService<ApiClient>(ApiModule, 'ApiClient')

      // Check
      expect(apiClient).toBeInstanceOf(ApiClientImpl)
      expect(apiClient.makeRequest()).toBe('Making request to https://api.example.com')
    })
  })

  describe('Scopes', () => {
    test('Singleton scope (default)', async () => {
      @Injectable()
      class SingletonService {
        private counter = 0

        public incrementCounter(): number {
          return ++this.counter
        }

        public getCounter(): number {
          return this.counter
        }
      }

      @Module({
        providers: [
          {provide: SingletonService, useClass: SingletonService}
        ],
        exports: [SingletonService]
      })
      class TestModule {}

      // Load module
      await preloadModule(TestModule, true)

      // Get service twice - should be the same instance
      const service1 = moduleManager.getService<SingletonService>(TestModule, SingletonService)
      const service2 = moduleManager.getService<SingletonService>(TestModule, SingletonService)

      // Increment counter through first instance
      service1.incrementCounter()

      // Check counter value in second instance
      expect(service2.getCounter()).toBe(1)
      expect(service1).toBe(service2) // Should be the same object
    })

    test('Transient scope', async () => {
      // This test verifies the correct implementation of TRANSIENT scope
      @Injectable(Scope.TRANSIENT)
      class TransientService {
        private counter = 0

        public incrementCounter(): number {
          return ++this.counter
        }

        public getCounter(): number {
          return this.counter
        }
      }

      @Module({
        providers: [
          {provide: TransientService, useClass: TransientService}
        ],
        exports: [TransientService]
      })
      class TestModule {}

      // Load module
      await preloadModule(TestModule, true)

      // Get two instances - with TRANSIENT scope they should be different instances
      const service1 = await (moduleManager as any).getLoadedModule(TestModule).resolveProvider(TransientService)
      const service2 = await (moduleManager as any).getLoadedModule(TestModule).resolveProvider(TransientService)

      service1.incrementCounter()

      // With proper TRANSIENT implementation, service2 should be a separate instance with counter = 0
      expect(service2.getCounter()).toBe(0) // Should be 0 since it's a different instance
      expect(service1).not.toBe(service2) // Should be different objects
    })
  })

  describe('Re-export and module hierarchy', () => {
    test('Re-exporting service through multiple modules', async () => {
      @Injectable()
      class BaseService {
        public getValue(): string {
          return 'base value'
        }
      }

      @Module({
        providers: [
          {provide: BaseService, useClass: BaseService}
        ],
        exports: [BaseService]
      })
      class BaseModule {}

      @Module({
        imports: [BaseModule],
        exports: [BaseService] // Re-export BaseService without explicitly including it in providers
      })
      class MiddleModule {}

      @Module({
        imports: [MiddleModule],
        exports: [BaseService] // Re-export again
      })
      class TopModule {}

      // Load modules
      await preloadModule(BaseModule, true)
      await preloadModule(MiddleModule, false)
      await preloadModule(TopModule, false)

      // Get service from each module
      const baseService = moduleManager.getService<BaseService>(BaseModule, BaseService)
      const middleService = moduleManager.getService<BaseService>(MiddleModule, BaseService)
      const topService = moduleManager.getService<BaseService>(TopModule, BaseService)

      // Check
      expect(baseService).toBeInstanceOf(BaseService)
      expect(middleService).toBeInstanceOf(BaseService)
      expect(topService).toBeInstanceOf(BaseService)

      // All should point to the same instance
      expect(baseService).toBe(middleService)
      expect(middleService).toBe(topService)
    })

    test('Accessing service from root module even if not directly exported', async () => {
      @Injectable()
      class RootService {
        public getValue(): string {
          return 'root value'
        }
      }

      @Module({
        providers: [
          {provide: RootService, useClass: RootService}
        ],
        exports: [RootService]
      })
      class RootModule {}

      @Module({
        imports: [RootModule],
        // Not exporting RootService
      })
      class ChildModule {}

      // Load modules
      await preloadModule(RootModule, true)
      await preloadModule(ChildModule, false)

      // Try to get service from child module
      const serviceFromChild = moduleManager.getService<RootService>(ChildModule, RootService)

      // Check - should successfully get from root module, even if child doesn't export it
      expect(serviceFromChild).toBeInstanceOf(RootService)
      expect(serviceFromChild.getValue()).toBe('root value')
    })
  })

  describe('Asynchronous providers', () => {
    test('Asynchronous factory in provider', async () => {
      // Imitate asynchronous config retrieval
      const mockAsyncConfig = async () => {
        return {apiKey: 'test-api-key'}
      }

      interface Config {
        apiKey: string;
      }

      @Module({
        providers: [
          {
            provide: 'Config',
            useFactory: async () => {
              // Imitate asynchronous loading
              await new Promise(resolve => setTimeout(resolve, 10))
              return await mockAsyncConfig()
            }
          }
        ],
        exports: ['Config']
      })
      class ConfigModule {}

      // Load module
      await preloadModule(ConfigModule, true)

      // Get service
      const config = moduleManager.getService<Config>(ConfigModule, 'Config')

      // Check
      expect(config).toBeDefined()
      expect(config.apiKey).toBe('test-api-key')
    })

    test('Service with asynchronous dependencies', async () => {
      // Imitate asynchronous data retrieval
      const mockAsyncData = async () => {
        return {data: 'test-data'}
      }

      interface DataService {
        getData(): Promise<any>;
      }

      @Module({
        providers: [
          {
            provide: 'DataService',
            useFactory: async () => {
              return {
                getData: async () => {
                  await new Promise(resolve => setTimeout(resolve, 10))
                  return await mockAsyncData()
                }
              }
            }
          }
        ],
        exports: ['DataService']
      })
      class DataModule {}

      interface ConsumerService {
        processData(): Promise<string>;
      }

      @Module({
        imports: [DataModule],
        providers: [
          {
            provide: 'ConsumerService',
            useFactory: (dataService: DataService) => {
              return {
                processData: async () => {
                  const data = await dataService.getData()
                  return `Processed: ${data.data}`
                }
              }
            },
            deps: ['DataService']
          }
        ],
        exports: ['ConsumerService']
      })
      class ConsumerModule {}

      // Load modules
      await preloadModule(DataModule, true)
      await preloadModule(ConsumerModule, false)

      // Get service
      const consumerService = moduleManager.getService<ConsumerService>(ConsumerModule, 'ConsumerService')

      // Check
      expect(consumerService).toBeDefined()
      const result = await consumerService.processData()
      expect(result).toBe('Processed: test-data')
    })
  })

  describe('Lifecycle management', () => {
    test('Unloading module without dependencies (root module is never unloaded)', async () => {
      @Injectable()
      class TestService {
        public getValue(): string {
          return 'test value'
        }
      }

      @Module({
        providers: [
          {provide: TestService, useClass: TestService}
        ],
        exports: [TestService]
      })
      class TestModule {}

      @Module({
        imports: [TestModule],
        providers: [],
        exports: [TestService]
      })
      class RootModule {}

      // Load root module and test module
      await preloadModule(RootModule, true)

      // Check that modules are loaded
      expect(moduleManager.isModuleLoaded(TestModule)).toBe(true)
      expect(moduleManager.isModuleLoaded(RootModule)).toBe(true)

      // Try to unload root module
      moduleManager.unloadModule(RootModule)

      // Root module should not be unloaded since it's the root module
      expect(moduleManager.isModuleLoaded(RootModule)).toBe(true)

      // Since root module is not unloaded, its dependencies (TestModule) should remain loaded
      expect(moduleManager.isModuleLoaded(TestModule)).toBe(true)

      // Now let's try unloading the non-root module directly
      moduleManager.unloadModule(TestModule)

      // TestModule cannot be unloaded because RootModule depends on it
      expect(moduleManager.isModuleLoaded(TestModule)).toBe(true)

      // Let's create another module without dependencies for testing unloading
      @Injectable()
      class IndependentService {
        public getValue(): string {
          return 'independent value'
        }
      }

      @Module({
        providers: [
          {provide: IndependentService, useClass: IndependentService}
        ],
        exports: [IndependentService]
      })
      class IndependentModule {}

      // Load independent module
      await preloadModule(IndependentModule, false)
      expect(moduleManager.isModuleLoaded(IndependentModule)).toBe(true)

      // Unload independent module
      moduleManager.unloadModule(IndependentModule)

      // Independent module should be unloaded since no other modules depend on it
      expect(moduleManager.isModuleLoaded(IndependentModule)).toBe(false)
    })

    test('Cannot unload module that other modules depend on', async () => {
      @Injectable()
      class SharedService {
        public getValue(): string {
          return 'shared value'
        }
      }

      @Module({
        providers: [
          {provide: SharedService, useClass: SharedService}
        ],
        exports: [SharedService]
      })
      class SharedModule {}

      @Injectable()
      class DependentService {
        constructor(@Inject(SharedService) private readonly sharedService: SharedService) {}

        public getSharedValue(): string {
          return this.sharedService.getValue()
        }
      }

      @Module({
        imports: [SharedModule],
        providers: [
          {provide: DependentService, useClass: DependentService}
        ],
        exports: [DependentService]
      })
      class DependentModule {}

      // Load modules
      await preloadModule(SharedModule, true)
      await preloadModule(DependentModule, false)

      // Check that modules are loaded
      expect(moduleManager.isModuleLoaded(SharedModule)).toBe(true)
      expect(moduleManager.isModuleLoaded(DependentModule)).toBe(true)

      // Spy on console.warn using Vitest's spyOn
      // @ts-expect-error isOk
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation()

      // Try to unload shared module
      moduleManager.unloadModule(SharedModule)

      // Check that there was a warning and module is not unloaded
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(moduleManager.isModuleLoaded(SharedModule)).toBe(true)

      // Restore console.warn
      consoleWarnSpy.mockRestore()
    })
  })

  describe('Error handling', () => {
    test('Error when getting non-existent service', async () => {
      @Module({
        providers: [],
        exports: []
      })
      class EmptyModule {}

      // Load empty module
      await preloadModule(EmptyModule, true)

      // Try to get non-existent service
      expect(() => {
        moduleManager.getService(EmptyModule, 'NonExistentService')
      }).toThrow()
    })

    test('Error when initializing module with missing dependencies', async () => {
      @Injectable()
      class ServiceWithMissingDependency {
        constructor(@Inject('MissingDependency') private readonly dependency: any) {}
      }

      @Module({
        providers: [
          {provide: ServiceWithMissingDependency, useClass: ServiceWithMissingDependency}
        ],
        exports: [ServiceWithMissingDependency]
      })
      class BrokenModule {}

      // Try to load module with missing dependency
      // The preloadModule should reject with an error about missing dependency
      await expect(preloadModule(BrokenModule, true)).rejects.toThrow()
    })
  })
})
