import {
  INJECT_METADATA_KEY,
  INJECTABLE_METADATA_KEY,
  InjectionToken,
  MODULE_METADATA_KEY,
  ModuleOptions,
  Scope,
  SCOPE_METADATA_KEY,
  SINGLETON_MODULE_METADATA_KEY
} from '../di'

export function Module(options: ModuleOptions): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(MODULE_METADATA_KEY, options, target)
  }
}

export function Injectable(scope: Scope = Scope.SINGLETON): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, target)
    Reflect.defineMetadata(SCOPE_METADATA_KEY, scope, target)
  }
}

export function Inject(token: InjectionToken<unknown>): ParameterDecorator {
  return (target: Object, _: string | symbol | undefined, parameterIndex: number) => {
    const existingTokens = Reflect.getMetadata(INJECT_METADATA_KEY, target) || {}
    existingTokens[parameterIndex] = token
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingTokens, target)
  }
}

export function Singleton(): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(SINGLETON_MODULE_METADATA_KEY, true, target)
  }
}
