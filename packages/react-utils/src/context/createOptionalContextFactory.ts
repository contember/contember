import type { Context } from 'react'
import { createContext, useContext } from 'react'

export function createOptionalContextFactory<T>(name: string, initialValue: T): [Context<T>, () => T] {
  const OptionalContext = createContext<T>(initialValue)
  OptionalContext.displayName = name

  const useOptionalContext = () => {
    return useContext(OptionalContext) ?? initialValue
  }

  return [OptionalContext, useOptionalContext]
}
