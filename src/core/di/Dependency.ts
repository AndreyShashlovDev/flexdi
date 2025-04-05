import 'reflect-metadata'
import { ModuleRef } from './ModuleRef'
import { Abstract, InjectionToken, ModuleOptions, ModuleType, Scope } from './types'

export const INJECT_METADATA_KEY = Symbol.for('flexdi.INJECT_METADATA_KEY')
export const INJECTABLE_METADATA_KEY = Symbol.for('flexdi.INJECTABLE_METADATA_KEY')
export const MODULE_METADATA_KEY = Symbol.for('flexdi.MODULE_METADATA_KEY')
export const SCOPE_METADATA_KEY = Symbol.for('flexdi.SCOPE_METADATA_KEY')
export const SINGLETON_MODULE_METADATA_KEY = Symbol.for('flexdi.SINGLETON_MODULE_METADATA_KEY')

export function getModuleOptions(moduleClass: ModuleType): ModuleOptions {
  const options = Reflect.getMetadata(MODULE_METADATA_KEY, moduleClass)
  if (!options) {
    throw new Error(`${moduleClass.name} is not a valid module`)
  }
  return options
}

export function isSingletonModule(targetClass: ModuleType): boolean {
  return Reflect.getMetadata(SINGLETON_MODULE_METADATA_KEY, targetClass) === true
}

export const getTokenDebugName = (token: InjectionToken<unknown>): string => {
  if (typeof token === 'string' || typeof token === 'symbol') {
    return String(token)
  }

  if (typeof token === 'function') {
    return token.name
  }

  return String(token)
}

export const getTokenName = (token: InjectionToken<unknown>): string | symbol | Abstract<any> => {
  if (typeof token === 'string' || typeof token === 'symbol') {
    return token
  }
  if (typeof token === 'function') {
    return token
  }

  return String(token)
}

export class ProviderRef {
  public instance: any = null
  public factory: ((...args: any[]) => any | Promise<any>) | null = null
  public dependencies: (string | symbol | Abstract<any>)[] = []
  public scope: Scope = Scope.SINGLETON
  public sourceModule: string = ''

  constructor(
    public readonly token: string | symbol | Abstract<any>,
    public type: 'class' | 'value' | 'factory' | 'token',
    public readonly moduleRef: ModuleRef
  ) {}

  public async resolve(): Promise<any> {
    if (this.scope === Scope.SINGLETON && this.instance !== null) {
      return this.instance
    }

    if (!this.factory) {
      throw new Error(`Cannot resolve provider ${getTokenDebugName(this.token)}`)
    }

    // Resolving dependencies
    const deps = await Promise.all(this.dependencies.map(async dep => {
      try {

        return await this.moduleRef.resolveProvider(dep)

      } catch (error) {
        if (this.moduleRef.rootModule && this.moduleRef !== this.moduleRef.rootModule) {
          try {

            return await this.moduleRef.rootModule.resolveProvider(dep)

          } catch {
            return undefined
          }
        }
        return undefined
      }
    }))

    const missingDeps = this.dependencies.filter((_, index) => deps[index] === undefined)
    if (missingDeps.length > 0) {
      throw new Error(`Cannot resolve dependencies for ${getTokenDebugName(this.token)}: missing ${missingDeps.join(', ')}`)
    }

    try {
      // Universal handling of both synchronous and asynchronous factories
      const result = this.factory(...deps)
      const instance = result instanceof Promise ? await result : result

      // Caching singletons
      if (this.scope === Scope.SINGLETON) {
        this.instance = instance
      }

      return instance
    } catch (error) {
      throw error
    }
  }

  public dispose(): void {
    if (this.instance?.onDisposeInstance) {
      this.instance.onDisposeInstance()
    }

    this.instance = null
  }
}

export class ModuleManager {
  private moduleRefs = new Map<string, ModuleRef>()
  private singletonModuleRefs = new Map<string, ModuleRef>()
  private rootModuleRef: ModuleRef | null = null
  private moduleImports = new Map<string, Set<string>>()
  private initializationPromises = new Map<string, Promise<void>>()

  public registerModule(moduleClass: ModuleType, moduleRef: ModuleRef): void {
    if (!moduleRef.isSingleton) {
      this.moduleRefs.set(moduleClass.name, moduleRef)

    } else if (!this.singletonModuleRefs.has(moduleClass.name)) {
      this.singletonModuleRefs.set(moduleClass.name, moduleRef)
    }

    // Update imports graph
    if (moduleRef.options.imports) {
      for (const importedModule of moduleRef.options.imports) {
        if (!this.moduleImports.has(importedModule.name)) {
          this.moduleImports.set(importedModule.name, new Set<string>())
        }
        this.moduleImports.get(importedModule.name)!.add(moduleClass.name)
      }
    }
  }

  public isRootModule(moduleClass: ModuleType): boolean {
    return this.rootModuleRef?.moduleClass === moduleClass
  }

  // Find modules that import this module
  public findParentModules(moduleClass: ModuleType): ModuleType[] {
    const parentModuleNames = this.moduleImports.get(moduleClass.name) || new Set<string>()
    const result: ModuleType[] = []

    for (const parentName of parentModuleNames) {
      const parentRef = this.moduleRefs.get(parentName)
      if (parentRef?.moduleClass) {
        result.push(parentRef.moduleClass)
      }
    }

    return result
  }

  public getLoadedModule(moduleClass: ModuleType): ModuleRef | null {
    return this.moduleRefs.get(moduleClass.name) ?? this.singletonModuleRefs.get(moduleClass.name) ?? null
  }

  public isModuleLoaded(moduleClass: ModuleType): boolean {
    const moduleRef = this.getLoadedModule(moduleClass)
    return !!moduleRef && moduleRef.initialized
  }

  public async loadModule<T>(moduleClass: ModuleType, isRootModule: boolean = false): Promise<T> {
    if (this.isModuleLoaded(moduleClass)) {
      return new moduleClass() as T
    }

    // Check if module is already being initialized
    const existingPromise = this.initializationPromises.get(moduleClass.name)

    if (existingPromise) {
      await existingPromise
      return new moduleClass() as T
    }

    const isSingleton = isSingletonModule(moduleClass)
    const options = getModuleOptions(moduleClass)
    const moduleRef = new ModuleRef(options, moduleClass, isSingleton, this)

    let initPromise: Promise<void>

    if (isRootModule) {
      this.rootModuleRef = moduleRef
      initPromise = moduleRef.initialize(moduleRef)

    } else {
      initPromise = moduleRef.initialize(this.rootModuleRef)
    }

    this.initializationPromises.set(moduleClass.name, initPromise)

    try {
      await initPromise
      this.registerModule(moduleClass, moduleRef)
      return new moduleClass() as T
    } finally {
      this.initializationPromises.delete(moduleClass.name)
    }
  }

  // Get service from module (synchronous method)
  public getService<T>(moduleClass: ModuleType, token: InjectionToken<unknown>): T {
    const moduleRef = this.getLoadedModule(moduleClass)

    if (!moduleRef) {
      throw new Error(`Module ${moduleClass.name} not loaded`)
    }

    const tokenName = getTokenName(token)

    // Check export
    if (!moduleRef.isExported(tokenName)) {
      // Check in root module
      if (this.rootModuleRef?.instanceCache.has(tokenName)) {
        return this.rootModuleRef.instanceCache.get(tokenName)
      }
      throw new Error(`Token ${getTokenDebugName(tokenName)} not exported from module ${moduleClass.name}`)
    }

    // Get from cache
    if (moduleRef.instanceCache.has(tokenName)) {
      return moduleRef.instanceCache.get(tokenName)
    }

    // Check in root module
    if (this.rootModuleRef?.instanceCache.has(tokenName)) {
      return this.rootModuleRef.instanceCache.get(tokenName)
    }

    throw new Error(`Provider ${getTokenDebugName(tokenName)} not pre-initialized in module ${moduleClass.name}`)
  }

  public unloadModule(moduleClass: ModuleType): void {
    const moduleRef = this.getLoadedModule(moduleClass)

    if (!moduleRef || moduleRef.isSingleton) {
      return
    }

    // Don't unload root module
    if (moduleRef === this.rootModuleRef) {
      console.warn('Cannot unload root module')
      return
    }

    // Check dependent modules by imports
    const dependentModules = this.findDependentModules(moduleClass)
    if (dependentModules.length > 0) {
      console.warn(`Cannot unload module ${moduleClass.name}, still imported by: ${dependentModules.join(', ')}`)
      return
    }

    // First unload the module itself
    moduleRef.dispose()
    this.moduleRefs.delete(moduleClass.name)

    // Remove from imports graph
    this.moduleImports.delete(moduleClass.name)
    for (const imports of this.moduleImports.values()) {
      imports.delete(moduleClass.name)
    }

    // Then try to unload modules that this module imported,
    // if there are no other dependencies on them now
    if (moduleRef.options.imports) {
      for (const importedClass of moduleRef.options.imports) {
        if (this.findDependentModules(importedClass).length === 0) {
          this.unloadModule(importedClass)
        }
      }
    }
  }

  private findDependentModules(moduleClass: ModuleType): string[] {
    const dependentModules: string[] = []

    for (const [name, otherModuleRef] of this.moduleRefs.entries()) {
      if (otherModuleRef.imports.some(importedRef => importedRef.moduleClass.name === moduleClass.name)) {
        dependentModules.push(name)
      }
    }

    return dependentModules
  }
}
