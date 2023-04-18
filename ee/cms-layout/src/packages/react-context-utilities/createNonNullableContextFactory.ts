import type { Context } from 'react'
import { createContext, useContext } from 'react'

export function createNonNullableContextFactory<T>(displayName: string, initialValue?: T): [Context<T>, () => NonNullable<T>] {
  const RequiredContext = createContext<T>((initialValue ?? null)!)
  RequiredContext.displayName = displayName

  const useRequiredContext = () => {
    const context = useContext(RequiredContext)

    if (context == null) {
      throw new Error(`use${displayName} must be used within a ${displayName} provider`)
    }

    return context
  }

  return [RequiredContext, useRequiredContext]
}
