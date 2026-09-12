import 'reflect-metadata'
import { beforeEach, describe, expect, test } from 'vitest'
import { Inject, Injectable, Module, ModuleManager, ModuleManagerFactory, preloadModule } from '../src/core'

// This project's own test runner transpiles TypeScript with esbuild, which does not implement
// `emitDecoratorMetadata` - so `design:paramtypes` never appears here automatically (see the
// README's "Vite setup" section for the Babel-based setup real projects need for this to work).
// These tests seed that metadata by hand to verify FlexDI's own consumption of it, independent
// of any particular bundler.
describe('Implicit constructor injection via design:paramtypes', () => {
  let moduleManager: ModuleManager

  beforeEach(() => {
    ModuleManagerFactory.resetInstance()
    moduleManager = ModuleManagerFactory.getInstance()
  })

  test('resolves a dependency from its constructor type when @Inject() is omitted', async () => {
    @Injectable()
    class DependencyService {
      public getValue(): string {
        return 'dependency value'
      }
    }

    @Injectable()
    class ServiceWithImplicitDependency {
      constructor(private readonly dependencyService: DependencyService) {}

      public getDependencyValue(): string {
        return this.dependencyService.getValue()
      }
    }

    // Simulates what tsc / babel-plugin-transform-typescript-metadata emits for the
    // constructor above.
    Reflect.defineMetadata('design:paramtypes', [DependencyService], ServiceWithImplicitDependency)

    @Module({
      providers: [
        {provide: DependencyService, useClass: DependencyService},
        {provide: ServiceWithImplicitDependency, useClass: ServiceWithImplicitDependency}
      ],
      exports: [ServiceWithImplicitDependency]
    })
    class TestModule {}

    await preloadModule(TestModule, true)

    const service = moduleManager.getService<ServiceWithImplicitDependency>(
      TestModule, ServiceWithImplicitDependency
    )

    expect(service.getDependencyValue()).toBe('dependency value')
  })

  test('an explicit @Inject() overrides the constructor type at that position', async () => {
    @Injectable()
    class DependencyService {
      public getValue(): string {
        return 'real dependency value'
      }
    }

    @Injectable()
    class DependencyOverride {
      public getValue(): string {
        return 'overridden value'
      }
    }

    @Injectable()
    class ServiceWithMixedDependency {
      constructor(@Inject(DependencyOverride) private readonly dependencyService: DependencyService) {}

      public getDependencyValue(): string {
        return this.dependencyService.getValue()
      }
    }

    // Same simulated metadata tsc/babel would produce - the type-level dependency is
    // DependencyService, but the explicit @Inject() below must still win.
    Reflect.defineMetadata('design:paramtypes', [DependencyService], ServiceWithMixedDependency)

    @Module({
      providers: [
        {provide: DependencyOverride, useClass: DependencyOverride},
        {provide: ServiceWithMixedDependency, useClass: ServiceWithMixedDependency}
      ],
      exports: [ServiceWithMixedDependency]
    })
    class TestModule {}

    await preloadModule(TestModule, true)

    const service = moduleManager.getService<ServiceWithMixedDependency>(TestModule, ServiceWithMixedDependency)

    expect(service.getDependencyValue()).toBe('overridden value')
  })

  test('throws a clear error when a parameter type erases to an ambiguous runtime type', async () => {
    @Injectable()
    class ServiceWithUnresolvableDependency {
      // In real compiler output an interface/primitive/generic param erases to Object/String/etc.
      constructor() {}
    }

    // Simulates what tsc emits for a `string` parameter with no explicit @Inject().
    Reflect.defineMetadata('design:paramtypes', [String], ServiceWithUnresolvableDependency)

    @Module({
      providers: [
        {provide: ServiceWithUnresolvableDependency, useClass: ServiceWithUnresolvableDependency}
      ],
      exports: [ServiceWithUnresolvableDependency]
    })
    class TestModule {}

    await expect(preloadModule(TestModule, true)).rejects.toThrow(/Add an explicit @Inject/)
  })
})
