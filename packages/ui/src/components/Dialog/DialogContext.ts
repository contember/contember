import { createContext } from 'react'
import { DialogOptions } from './DialogOptions'

export const DialogContext = createContext<DialogOptions | undefined>(undefined)
