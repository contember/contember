import type { Context } from 'react'
import { createContext, useContext } from 'react'

const EmptyContextSymbol = Symbol('EmptyContextSymbol')

export function createRequiredContext<T>(displayName: string): [Context<T>, () => T] {
  const RequiredContext = createContext<T>(EmptyContextSymbol as T)
  RequiredContext.displayName = displayName

  const useRequiredContext = (): T => {
    const context = useContext(RequiredContext)

    if (context === EmptyContextSymbol) {
      throw new Error(`use${displayName} must be used within a ${displayName} provider`)
    }

    return context
  }

  return [RequiredContext, useRequiredContext]
}
