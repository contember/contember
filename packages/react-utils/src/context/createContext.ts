import type { Context } from 'react'
import { createContext as baseCreateContext, useContext } from 'react'

export function createContext<T>(name: string, initialValue: T): [Context<T>, () => T] {
  const OptionalContext = baseCreateContext<T>(initialValue)
  OptionalContext.displayName = name

  return [OptionalContext, () => useContext(OptionalContext)]
}
