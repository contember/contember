import { createContext } from 'react'

export const DataGridKeyContext = createContext<string>('')

export const DataGridKeyProvider = DataGridKeyContext.Provider
