import { createContext } from 'react'
import type { RadioGroupState } from 'react-stately'

export const RadioContext = createContext<RadioGroupState | null>(null)
