import 'reflect-metadata'
import {
  Abstract,
  InjectionToken,
  ModuleClassProvider,
  ModuleFactoryProvider,
  ModuleOptions,
  ModuleTokenProvider,
  ModuleType,
  ModuleValueProvider,
  ProviderOptions,
  Scope
} from './types'

export const INJECT_METADATA_KEY = Symbol.for('flexdi.INJECT_METADATA_KEY')
export const INJECTABLE_METADATA_KEY = Symbol.for('flexdi.INJECTABLE_METADATA_KEY')
export const MODULE_METADATA_KEY = Symbol.for('flexdi.MODULE_METADATA_KEY')
export const SCOPE_METADATA_KEY = Symbol.for('flexdi.SCOPE_METADATA_KEY')
export const SINGLETON_MODULE_METADATA_KEY = Symbol.for('flexdi.SINGLETON_MODULE_METADATA_KEY')

function getModuleOptions(moduleClass: ModuleType): ModuleOptions {
  const options = Reflect.getMetadata(MODULE_METADATA_KEY, moduleClass)
  if (!options) {
    throw new Error(`${moduleClass.name} is not a valid module`)
  }
  return options
}

function getClassScope(targetClass: ModuleType): Scope | null {
  return Reflect.getMetadata(SCOPE_METADATA_KEY, targetClass) || null
}

function getInjectionTokens(targetClass: ModuleType): any[] {
  try {
    const injectMetadata = Reflect.getMetadata(INJECT_METADATA_KEY, targetClass) || {}

    const maxParamIndex = Object.keys(injectMetadata).length > 0
      ? Math.max(...Object.keys(injectMetadata).map(Number))
      : -1
    const paramsCount = maxParamIndex + 1

    const params = new Array(paramsCount).fill(null)

    for (const [index, token] of Object.entries(injectMetadata)) {
      params[Number(index)] = token
    }

    return params
  } catch (error) {
    console.warn(`Failed to get tokens for ${targetClass?.name}`)
    return []
  }
}

function isSingletonModule(targetClass: ModuleType): boolean {
  return Reflect.getMetadata(SINGLETON_MODULE_METADATA_KEY, targetClass) === true
}

const getTokenDebugName = (token: InjectionToken<unknown>): string => {
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

export class ModuleRef {
  public providers = new Map<string | symbol | Abstract<any>, ProviderRef>()
  public imports: ModuleRef[] = []
  public exports = new Set<string | symbol | Abstract<any>>()
  public initialized = false
  public initializing = false
  public rootModule: ModuleRef | null = null
  public instanceCache = new Map<string | symbol | Abstract<any>, any>()

  constructor(
    public readonly options: ModuleOptions,
    public readonly moduleClass: ModuleType,
    public readonly isSingleton: boolean,
  ) {}

  public get name(): string {
    return this.moduleClass.name
  }

  public isExported(token: InjectionToken<unknown>): boolean {
    const tokenName = getTokenName(token)
    return this.exports.has(tokenName)
  }

  public getLocalProvider(token: InjectionToken<unknown>): ProviderRef | null {
    const tokenName = getTokenName(token)
    return this.providers.get(tokenName) || null
  }

  // Asynchronous provider retrieval
  public async resolveProvider(token: InjectionToken<unknown>): Promise<any> {
    const tokenName = getTokenName(token)

    const provider = this.getLocalProvider(tokenName)

    // For Transient scope, don't use cache, always resolve anew
    if (provider && provider.scope === Scope.TRANSIENT) {
      return await provider.resolve()
    }

    if (this.instanceCache.has(tokenName)) {
      return this.instanceCache.get(tokenName)
    }

    if (provider) {
      const instance = await provider.resolve()
      if (provider.scope === Scope.SINGLETON) {
        this.instanceCache.set(tokenName, instance)
      }
      return instance
    }

    for (const importedModule of this.imports) {
      if (importedModule.isExported(tokenName)) {
        try {
          return await importedModule.resolveProvider(tokenName)
        } catch {}
      }
    }

    if (this.rootModule && this !== this.rootModule) {
      try {
        return await this.rootModule.resolveProvider(tokenName)
      } catch {}
    }

    const parentModules = moduleManager.findParentModules(this.moduleClass)

    for (const parentModule of parentModules) {
      const parentModuleRef = moduleManager.getLoadedModule(parentModule)
      if (parentModuleRef) {
        try {
          return await parentModuleRef.resolveProvider(tokenName)
        } catch {}
      }
    }

    throw new Error(`Provider ${getTokenDebugName(tokenName)} not found in module ${this.name}`)
  }

  public async initialize(rootModule: ModuleRef | null = null): Promise<void> {
    if (this.initialized) {
      return
    }

    if (this.initializing) {
      await new Promise<void>(resolve => {
        const checkInterval = setInterval(() => {
          if (!this.initializing) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 10)
      })
      return
    }

    this.initializing = true

    try {
      this.rootModule = rootModule || this

      // Initialize imported modules
      if (this.options.imports?.length) {
        for (const importClass of this.options.imports) {
          let importedModule = moduleManager.getLoadedModule(importClass)

          if (!importedModule) {
            const isSingleton = isSingletonModule(importClass)

            importedModule = new ModuleRef(
              getModuleOptions(importClass),
              importClass,
              isSingleton
            )

            await importedModule.initialize(this.rootModule)
            moduleManager.registerModule(importClass, importedModule)
          }

          this.imports.push(importedModule)

          // Process exports of the imported module
          if (this.options.exports) {
            for (const exportToken of this.options.exports) {
              const exportTokenName = getTokenName(exportToken)

              if (importedModule.isExported(exportTokenName) && !this.providers.has(exportTokenName)) {
                // Create provider for re-export
                const reexportRef = new ProviderRef(exportTokenName, 'token', this)
                reexportRef.sourceModule = importedModule.name
                reexportRef.factory = () => this.instanceCache.get(exportTokenName)
                reexportRef.scope = Scope.SINGLETON

                this.providers.set(exportTokenName, reexportRef)

                // Pre-load for synchronous access
                this.instanceCache.set(exportTokenName, await importedModule.resolveProvider(exportTokenName))
              }
            }
          }
        }
      }

      // Register providers
      if (this.options.providers?.length) {
        for (const providerOptions of this.options.providers) {
          await this.registerProvider(providerOptions)
        }
      }

      // Register exports
      if (this.options.exports?.length) {
        for (const exportToken of this.options.exports) {
          const tokenName = getTokenName(exportToken)
          this.exports.add(tokenName)

          // If the exported token is not registered locally
          if (!this.providers.has(tokenName)) {
            let found = false

            for (const importedModule of this.imports) {
              if (importedModule.isExported(tokenName)) {
                found = true

                // Register re-exported provider
                const reexportRef = new ProviderRef(tokenName, 'token', this)
                reexportRef.sourceModule = importedModule.name
                reexportRef.factory = () => this.instanceCache.get(tokenName)
                reexportRef.scope = Scope.SINGLETON

                this.providers.set(tokenName, reexportRef)

                this.instanceCache.set(tokenName, await importedModule.resolveProvider(tokenName))
                break
              }
            }

            if (!found) {
              console.warn(`Module ${this.name} exports token ${getTokenDebugName(tokenName)} not found`)
            }
          }
        }
      }

      await this.preInitializeExports()

      this.initialized = true
    } finally {
      this.initializing = false
    }
  }

  private async preInitializeExports(): Promise<void> {
    for (const exportToken of this.exports) {

      if (!this.instanceCache.has(exportToken)) {
        try {
          const provider = this.providers.get(exportToken)
          if (provider) {
            const instance = await provider.resolve()
            this.instanceCache.set(exportToken, instance)
          }

        } catch (error) {
          console.error(`Failed to pre-initialize export ${getTokenDebugName(exportToken)}`)
        }
      }
    }
  }

  private async registerProvider(providerOptions: ProviderOptions): Promise<void> {
    const tokenName = getTokenName(providerOptions.provide)

    if (this.providers.has(tokenName)) {
      return
    }

    const providerRef = new ProviderRef(tokenName, 'class', this)
    providerRef.sourceModule = this.name

    if ('useClass' in providerOptions) {
      const classProvider = providerOptions as ModuleClassProvider
      const targetClass = classProvider.useClass

      providerRef.scope = classProvider.scope || getClassScope(targetClass) || Scope.SINGLETON

      const injectionTokens = getInjectionTokens(targetClass)
      providerRef.dependencies = injectionTokens.map(token => getTokenName(token))

      const missingDependencies: (string | symbol | Abstract<any>)[] = []

      for (const token of providerRef.dependencies) {
        const isLocallyAvailable = this.providers.has(token)
        let isAvailableThroughImports = false

        for (const importedModule of this.imports) {
          if (importedModule.isExported(token)) {
            isAvailableThroughImports = true
            break
          }
        }

        // Check availability in root module
        const isAvailableInRoot = this.rootModule !== this &&
          this.rootModule !== null &&
          this.rootModule.providers.has(token)

        if (!isLocallyAvailable && !isAvailableThroughImports && !isAvailableInRoot) {
          missingDependencies.push(token)
        }
      }

      if (missingDependencies.length > 0) {
        const missingTokensStr = missingDependencies
          .map(token => typeof token === 'function' ? token.name : String(token))
          .join(', ')

        throw new Error(
          `Cannot register provider ${getTokenDebugName(tokenName)} (${targetClass.name}) in module ${this.name}: ` +
          `missing dependencies [${missingTokensStr}]. ` +
          `Make sure all dependencies are available through the module's providers, imports, or root module.`
        )
      }

      providerRef.factory = (...deps: any[]) => new targetClass(...deps)
    } else if ('useValue' in providerOptions) {
      const valueProvider = providerOptions as ModuleValueProvider

      providerRef.type = 'value'
      providerRef.scope = Scope.SINGLETON
      providerRef.instance = valueProvider.useValue

    } else if ('useFactory' in providerOptions) {
      const factoryProvider = providerOptions as ModuleFactoryProvider

      providerRef.type = 'factory'
      providerRef.scope = Scope.SINGLETON

      if (factoryProvider.deps) {
        providerRef.dependencies = factoryProvider.deps.map(token => getTokenName(token))
      }

      providerRef.factory = (...deps: any[]) => factoryProvider.useFactory(...deps)

    } else if ('useToken' in providerOptions) {
      const tokenProvider = providerOptions as ModuleTokenProvider

      providerRef.type = 'token'
      providerRef.scope = Scope.SINGLETON
      providerRef.dependencies = [getTokenName(tokenProvider.useToken)]
      providerRef.factory = (dep: any) => dep
    }

    this.providers.set(tokenName, providerRef)

    // Pre-load exported providers
    if (this.options.exports?.some(exp => getTokenName(exp) === tokenName)) {
      try {
        const instance = await providerRef.resolve()
        this.instanceCache.set(tokenName, instance)
      } catch (error) {
        console.error(`Failed to pre-initialize provider ${getTokenDebugName(tokenName)}`)
      }
    }
  }

  public dispose(): void {
    for (const provider of this.providers.values()) {
      provider.dispose()
    }

    this.providers.clear()
    this.exports.clear()
    this.imports = []
    this.initialized = false
    this.rootModule = null
    this.instanceCache.clear()
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
    const moduleRef = new ModuleRef(options, moduleClass, isSingleton)

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

export const moduleManager = new ModuleManager()
