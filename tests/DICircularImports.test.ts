import 'reflect-metadata'
import { describe, expect, test } from 'vitest'
import { Injectable, Module, MODULE_METADATA_KEY, preloadModule } from '../src/core'

describe('circular module imports', () => {
  test('two modules importing each other throw a clear error instead of overflowing the stack', async () => {
    @Injectable()
    class AService {
      getValue() { return 'a' }
    }

    @Module({
      imports: [],
      providers: [{provide: AService, useClass: AService}],
      exports: [AService]
    })
    class ModuleA {}

    @Module({
      imports: [ModuleA],
      providers: [],
      exports: []
    })
    class ModuleB {}

    const optionsA = Reflect.getMetadata(MODULE_METADATA_KEY, ModuleA)
    Reflect.defineMetadata(MODULE_METADATA_KEY, {...optionsA, imports: [ModuleB]}, ModuleA)

    await expect(preloadModule(ModuleB, true)).rejects.toThrow(
      /Circular module dependency detected: ModuleB -> ModuleA -> ModuleB/
    )
  })

  test('a three-module cycle (A -> B -> C -> A) is also detected', async () => {
    @Module({imports: [], providers: [], exports: []})
    class ModuleA {}

    @Module({imports: [ModuleA], providers: [], exports: []})
    class ModuleB {}

    @Module({imports: [ModuleB], providers: [], exports: []})
    class ModuleC {}

    const optionsA = Reflect.getMetadata(MODULE_METADATA_KEY, ModuleA)
    Reflect.defineMetadata(MODULE_METADATA_KEY, {...optionsA, imports: [ModuleC]}, ModuleA)

    await expect(preloadModule(ModuleA, true)).rejects.toThrow(
      /Circular module dependency detected: ModuleA -> ModuleC -> ModuleB -> ModuleA/
    )
  })

  test('a shared (diamond) import is not mistaken for a cycle', async () => {
    @Injectable()
    class SharedService {
      getValue() { return 'shared' }
    }

    @Module({
      providers: [{provide: SharedService, useClass: SharedService}],
      exports: [SharedService]
    })
    class SharedModule {}

    @Module({imports: [SharedModule], exports: [SharedService]})
    class BranchB {}

    @Module({imports: [SharedModule], exports: [SharedService]})
    class BranchC {}

    @Module({imports: [BranchB, BranchC], exports: []})
    class AppModule {}

    await expect(preloadModule(AppModule, true)).resolves.toBeUndefined()
  })
})
