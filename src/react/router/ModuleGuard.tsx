import React, { FC, ReactNode, useEffect, useRef, useState } from 'react'
import { moduleManager, ModuleType, preloadModule } from '../../core'

interface ModuleGuardParams {
  module: ModuleType
  children: ReactNode
  LoadingComponent: FC
  ErrorComponent: FC
  isRootModule?: boolean
}

export const ModuleGuard = ({
  module,
  children,
  LoadingComponent,
  ErrorComponent,
  isRootModule = false,
}: ModuleGuardParams) => {
  const isLoading = useRef<boolean>(false)
  const [isLoaded, setIsLoaded] = useState<boolean>(moduleManager.isModuleLoaded(module))
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (isLoading.current) {
      return
    }

    let isMounted = true
    isLoading.current = true

    preloadModule(module, isRootModule)
      .then(() => {setIsLoaded(true)})
      .catch(err => {
        setIsLoaded(false)

        if (isMounted) {
          console.error('Error loading module:', module.name, err)
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      })

    return () => {
      isMounted = false
      setIsLoaded(false)
      isLoading.current = false

      moduleManager.unloadModule(module)
    }
  }, [module])

  if (error) {
    return <ErrorComponent />
  }

  if (!isLoaded) {
    return <LoadingComponent />
  }

  return <>{children}</>
}
