import {
  getModuleOptions,
  getTokenDebugName,
  getTokenName,
  INJECT_METADATA_KEY,
  isSingletonModule, ModuleManager,
  ProviderRef,
  SCOPE_METADATA_KEY
} from './Dependency'

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
    private readonly moduleManagerInstance: ModuleManager
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

    const parentModules = this.moduleManagerInstance.findParentModules(this.moduleClass)

    for (const parentModule of parentModules) {
      const parentModuleRef = this.moduleManagerInstance.getLoadedModule(parentModule)
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
          let importedModule = this.moduleManagerInstance.getLoadedModule(importClass)

          if (!importedModule) {
            const isSingleton = isSingletonModule(importClass)

            importedModule = new ModuleRef(
              getModuleOptions(importClass),
              importClass,
              isSingleton,
              this.moduleManagerInstance,
            )

            await importedModule.initialize(this.rootModule)
            this.moduleManagerInstance.registerModule(importClass, importedModule)
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
