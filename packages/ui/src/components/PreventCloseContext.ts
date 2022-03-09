import { createContext, useContext } from 'react'

export const PreventCloseContext = createContext(() => {})

export function usePreventCloseContext() {
  return useContext(PreventCloseContext)
}
